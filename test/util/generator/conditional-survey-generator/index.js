'use strict';

const _ = require('lodash');
const models = require('../../../../models');

const SurveyGenerator = require('../survey-generator');
const Answerer = require('../answerer');

const conditionalQuestions = require('./conditional-questions');
const requiredOverrides = require('./required-overrides');
const errorAnswerSetup = require('./error-answer-setup');
const passAnswerSetup = require('./pass-answer-setup');

const counts = [8, 8, 8, 8, 8, 8, 8, 8, 8, '8e', '8e', '8e', '8e' /**/ , '8e', '8e', '8e', '8e', '8e'];

const specialQuestionGenerator = {
    multipleSupport(surveyGenerator, questionInfo) {
        return surveyGenerator.questionGenerator.newMultiQuestion('text', questionInfo.selectionCount);
    },
    type(surveyGenerator, questionInfo) {
        return surveyGenerator.questionGenerator.newQuestion(questionInfo.type);
    },
    skip(surveyGenerator, questionInfo) {
        const { type, logic, count } = questionInfo;
        const question = surveyGenerator.questionGenerator.newQuestion(type);
        const skip = { rule: {} };
        if (count !== undefined) {
            skip.count = count;
        }
        if (logic !== undefined) {
            skip.rule.logic = logic;
        }
        surveyGenerator.addAnswer(skip.rule, questionInfo, question);
        question.skip = skip;
        return question;
    },
    enableWhen(surveyGenerator, questionInfo, index) {
        const { type, relativeIndex, logic } = questionInfo;
        const question = surveyGenerator.questionGenerator.newQuestion(type);
        const questionIndex = index - relativeIndex;
        const enableWhen = { questionIndex, rule: { logic } };
        //surveyGenerator.addAnswer(enableWhen.rule, questionInfo, question);
        question.enableWhen = enableWhen;
        return question;
    },
    toEnableWhen(surveyGenerator, questionInfo, index) {
        const { type, logic, count } = questionInfo;
        const question = surveyGenerator.questionGenerator.newQuestion(type);
        const skip = { rule: {} };
        if (count !== undefined) {
            skip.count = count;
        }
        skip.questionIndex = index;
        if (logic !== undefined) {
            skip.rule.logic = logic;
        }
        surveyGenerator.addAnswer(skip.rule, questionInfo, question);
        question.skip = skip;
        return question;
    }
};

module.exports = class ConditionalSurveyGenerator extends SurveyGenerator {
    constructor({ questionGenerator, answerer } = {}) {
        super(questionGenerator);
        this.answerer = answerer || new Answerer();
    }

    count() {
        const surveyIndex = this.currentIndex();
        const count = counts[surveyIndex];
        if ((typeof count) === 'string') {
            return parseInt(count, 10);
        }
        return count;
    }

    numOfCases() {
        return counts.length;
    }

    addAnswer(rule, questionInfo, question) {
        const logic = questionInfo.logic;
        if (logic === 'equals' || logic === 'not-equals') {
            rule.answer = this.answerer.answerRawQuestion(question);
        }
        if (logic === 'not-selected') {
            const choices = question.choices;
            const selectionCount = questionInfo.selectionCount;
            rule.selectionTexts = _.range(choices.length - selectionCount, choices.length).map(index => choices[index].text);
        }
        if (logic === 'each-not-selected') {
            question.choices = question.choices.slice(0, 4);
        }
    }

    getConditionalQuestion(key) {
        return conditionalQuestions[key];
    }

    getRequiredOverride(key) {
        return requiredOverrides[key];
    }

    newSurveyQuestion(index) {
        const surveyIndex = this.currentIndex();
        const key = `${surveyIndex}-${index}`;
        const questionInfo = this.getConditionalQuestion(key);
        let question;
        if (questionInfo) {
            const purpose = questionInfo.purpose || 'skip';
            question = specialQuestionGenerator[purpose](this, questionInfo, index);
            question.required = false;
        } else {
            question = super.newSurveyQuestion(index);
        }
        const requiredOverride = this.getRequiredOverride(key);
        if (requiredOverride !== undefined) {
            question.required = requiredOverride;
        }
        return question;
    }

    static conditionalErrorSetup() {
        return errorAnswerSetup;
    }

    static conditionalPassSetup() {
        return passAnswerSetup;
    }

    answersWithConditions(survey, { questionIndex, rulePath, skipCondition, noAnswers, selectionChoice, multipleIndices }) {
        const questions = models.survey.getQuestions(survey);
        const doNotAnswer = new Set(noAnswers);
        rulePath = rulePath || `${questionIndex}.skip.rule.answer`;
        const ruleAnswer = _.get(questions, rulePath);
        const answers = questions.reduce((r, question, index) => {
            if (doNotAnswer.has(index)) {
                return r;
            }
            if (questionIndex === index) {
                if (skipCondition === true) {
                    const answer = { questionId: question.id, answer: ruleAnswer };
                    r.push(answer);
                    return r;
                }
                if (skipCondition === false) {
                    let answer = this.answerer.answerQuestion(question);
                    if (_.isEqual(answer.answer, ruleAnswer)) {
                        answer = this.answerer.answerQuestion(question);
                    }
                    r.push(answer);
                    return r;
                }
                if (selectionChoice) {
                    const answer = this.answerer.answerChoicesQuestion(question, selectionChoice);
                    r.push(answer);
                    return r;
                }
            }
            if ((questionIndex + 1 === index) && multipleIndices) {
                if (multipleIndices.length) {
                    const answer = this.answerer.answerMultipleQuestion(question, multipleIndices);
                    r.push(answer);
                }
                return r;
            }
            const answer = this.answerer.answerQuestion(question);
            r.push(answer);
            return r;
        }, []);
        return answers;
    }

    newSurvey() {
        const survey = super.newSurvey({ noSection: true });
        const surveyIndex = this.currentIndex();
        const surveyCount = counts[surveyIndex];
        if ((typeof surveyCount) !== 'string') {
            return survey;
        }
        const key = Object.keys(conditionalQuestions).find(key => parseInt(key, 10) === surveyIndex && conditionalQuestions[key].purpose !== 'type');

        const questionIndex = parseInt(key.split('-')[1], 10);
        const question = survey.questions[questionIndex];

        if (question.skip) {
            const skip = question.skip;
            delete question.skip;
            const deletedQuestions = survey.questions.splice(questionIndex + 1, skip.count);
            delete skip.count;
            question.section = {
                questions: deletedQuestions,
                enableWhen: skip
            };
        }
        if (question.enableWhen) {
            const sourceIndex = question.enableWhen.questionIndex;
            this.addAnswer(question.enableWhen.rule, question.enableWhen.rule, survey.questions[sourceIndex]);
        }
        return survey;
    }

    static newSurveyFromPrevious(clientSurvey, serverSurvey) {
        const questions = serverSurvey.questions.map(({ id, required, skip, enableWhen, section }) => {
            const question = { id, required };
            if (skip) {
                question.skip = _.cloneDeep(skip);
                delete question.skip.rule.id;
            }
            if (enableWhen) {
                question.enableWhen = _.cloneDeep(enableWhen);
                delete question.enableWhen.rule.id;
            }
            if (section) {
                question.section = _.cloneDeep(section);
                delete question.section.id;
                const enableWhen = question.section.enableWhen;
                if (enableWhen) {
                    delete enableWhen.rule.id;
                }
                question.section.questions = question.section.questions.map(({ id, required }) => ({ id, required }));
            }
            return question;
        });
        const newSurvey = _.cloneDeep(clientSurvey);
        newSurvey.questions = questions;
        delete newSurvey.sections;
        return newSurvey;
    }
};
