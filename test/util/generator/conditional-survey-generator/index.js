'use strict';

const _ = require('lodash');

const SurveyGenerator = require('../survey-generator');
const Answerer = require('../answerer');

const conditionalQuestions = require('./conditional-questions');
const requiredOverrides = require('./required-overrides');
const errorAnswerSetup = require('./error-answer-setup');

const counts = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];

const specialQuestionGenerator = {
    multipleSupport(surveyGenerator, questionInfo) {
        return surveyGenerator.questionGenerator.newMultiQuestion('text', questionInfo.selectionCount);
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
        surveyGenerator.addAnswer(enableWhen.rule, questionInfo, question);
        question.enableWhen = enableWhen;
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
        return counts[surveyIndex];
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

    answersWithConditions(survey, { questionIndex, skipCondition, noAnswers, selectionChoice, multipleIndices }) {
        const doNotAnswer = new Set(noAnswers);
        const answers = survey.questions.reduce((r, question, index) => {
            if (doNotAnswer.has(index)) {
                return r;
            }
            if (questionIndex === index) {
                if (skipCondition === true) {
                    const answer = { questionId: question.id, answer: question.skip.rule.answer };
                    r.push(answer);
                    return r;
                }
                if (skipCondition === false) {
                    let answer = this.answerer.answerQuestion(question);
                    if (_.isEqual(answer.answer, question.skip.rule.answer)) {
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

    static newSurveyFromPrevious(clientSurvey, serverSurvey) {
        const questions = serverSurvey.questions.map(({ id, required, skip, enableWhen }) => {
            const question = { id, required };
            if (skip) {
                question.skip = _.cloneDeep(skip);
                delete question.skip.rule.id;
            }
            if (enableWhen) {
                question.enableWhen = _.cloneDeep(enableWhen);
                delete question.enableWhen.rule.id;
            }
            return question;
        });
        const newSurvey = _.cloneDeep(clientSurvey);
        newSurvey.questions = questions;
        delete newSurvey.sections;
        return newSurvey;
    }
};
