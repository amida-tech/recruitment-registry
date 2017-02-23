'use strict';

const _ = require('lodash');
const models = require('../../../../models');

const SurveyGenerator = require('../survey-generator');
const Answerer = require('../answerer');

const conditionalQuestions = require('./conditional-questions');
const requiredOverrides = require('./required-overrides');
const errorAnswerSetup = require('./error-answer-setup');
const passAnswerSetup = require('./pass-answer-setup');

const counts = [8, 8, 8, 8, 8, 8, 8, 8];

const conditionalQuestionMap = conditionalQuestions.reduce((r, questionInfo) => {
    const surveyIndex = questionInfo.surveyIndex;
    if (surveyIndex === undefined) {
        throw new Error('No survey index specified');
    }
    let survey = r[surveyIndex];
    if (!survey) {
        survey = {};
        r[surveyIndex] = survey;
    }
    const questionIndex = questionInfo.questionIndex;
    if (questionIndex === undefined) {
        throw new Error('No survey question index specified.');
    }
    survey[questionIndex] = questionInfo;
    return r;
}, {});

const specialQuestionGenerator = {
    multipleSupport(surveyGenerator, questionInfo) {
        return surveyGenerator.questionGenerator.newMultiQuestion('text', questionInfo.selectionCount);
    },
    type(surveyGenerator, questionInfo) {
        return surveyGenerator.questionGenerator.newQuestion(questionInfo.type);
    },
    enableWhen(surveyGenerator, questionInfo, index) {
        const { type, relativeIndex, logic } = questionInfo;
        const question = surveyGenerator.questionGenerator.newQuestion(type);
        const questionIndex = index - relativeIndex;
        const enableWhen = [{ questionIndex, logic }];
        question.enableWhen = enableWhen;
        return question;
    },
    questionSection(surveyGenerator, questionInfo) {
        return surveyGenerator.questionGenerator.newQuestion(questionInfo.type);
    }
};

const surveyManipulator = {
    enableWhen(survey, questionInfo, generator) {
        const questionIndex = questionInfo.questionIndex;
        const question = survey.questions[questionIndex];
        const sourceIndex = question.enableWhen[0].questionIndex;
        generator.addAnswer(question.enableWhen[0], question.enableWhen[0], survey.questions[sourceIndex]);
    },
    questionSection(survey, questionInfo, generator) {
        const { questionIndex, logic, count } = questionInfo;
        const question = survey.questions[questionIndex];
        const deletedQuestions = survey.questions.splice(questionIndex + 1, count);
        const rule = { questionIndex, logic };
        generator.addAnswer(rule, questionInfo, question);
        question.sections = [{
            questions: deletedQuestions,
            enableWhen: [rule]
        }];
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
    }

    getRequiredOverride(key) {
        return requiredOverrides[key];
    }

    newSurveyQuestion(index) {
        const surveyIndex = this.currentIndex();
        const questionInfo = conditionalQuestionMap[surveyIndex][index];
        let question;
        if (questionInfo) {
            const purpose = questionInfo.purpose;
            question = specialQuestionGenerator[purpose](this, questionInfo, index);
            question.required = false;
        } else {
            question = super.newSurveyQuestion(index);
        }
        const requiredOverride = this.getRequiredOverride(`${surveyIndex}-${index}`);
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

    answersWithConditions(survey, { questionIndex, rulePath, ruleAnswerState, selectionChoice, multipleIndices, noAnswers = [], specialAnswers = [] }) {
        const questions = models.survey.getQuestions(survey);
        const doNotAnswer = new Set(noAnswers);
        const doAnswer = new Map(specialAnswers.map(r => [r.questionIndex, r]));
        const answers = questions.reduce((r, question, index) => {
            if (doNotAnswer.has(index)) {
                return r;
            }
            const specialAnswer = doAnswer.get(index);
            if (specialAnswer) {
                const type = specialAnswer.type;
                if (type === 'samerule') {
                    const ruleQuestion = questions[specialAnswer.ruleQuestionIndex];
                    const enableWhen = ruleQuestion.enableWhen;
                    const enableWhenAnswer = enableWhen[0].answer;
                    if (!enableWhenAnswer) {
                        throw new Error('There should be an answer specified');
                    }
                    const answer = { questionId: question.id, answer: enableWhenAnswer };
                    r.push(answer);
                    return r;
                }
                if (type === 'differentrule') {
                    const ruleQuestion = questions[specialAnswer.ruleQuestionIndex];
                    const enableWhen = ruleQuestion.enableWhen;
                    const enableWhenAnswer = enableWhen[0].answer;
                    if (!enableWhenAnswer) {
                        throw new Error('There should be an answer specified');
                    }
                    let answer = this.answerer.answerQuestion(question);
                    if (_.isEqual(answer.answer, enableWhenAnswer)) {
                        answer = this.answerer.answerQuestion(question);
                    }
                    r.push(answer);
                    return r;
                }
                if (type === 'samerulesection') {
                    const enableWhen = question.sections[0].enableWhen;
                    const enableWhenAnswer = enableWhen[0].answer;
                    if (!enableWhenAnswer) {
                        throw new Error('There should be an answer specified');
                    }
                    const answer = { questionId: question.id, answer: enableWhenAnswer };
                    r.push(answer);
                    return r;
                }
                if (type === 'differentrulesection') {
                    const enableWhen = question.sections[0].enableWhen;
                    const enableWhenAnswer = enableWhen[0].answer;
                    if (!enableWhenAnswer) {
                        throw new Error('There should be an answer specified');
                    }
                    let answer = this.answerer.answerQuestion(question);
                    if (_.isEqual(answer.answer, enableWhenAnswer)) {
                        answer = this.answerer.answerQuestion(question);
                    }
                    r.push(answer);
                    return r;
                }
                if (type === 'selectchoice') {
                    const answer = this.answerer.answerChoicesQuestion(question, specialAnswer.selectionChoice);
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
        _.forOwn(conditionalQuestionMap[surveyIndex], questionInfo => {
            const purpose = questionInfo.purpose;
            const manipulator = surveyManipulator[purpose];
            if (manipulator) {
                manipulator(survey, questionInfo, this);
            }
        });
        return survey;
    }

    static newSurveyFromPrevious(clientSurvey, serverSurvey) {
        const questions = serverSurvey.questions.map(({ id, required, enableWhen, sections }) => {
            const question = { id, required };
            if (enableWhen) {
                question.enableWhen = _.cloneDeep(enableWhen);
                delete question.enableWhen[0].id;
            }
            if (sections) {
                question.sections = _.cloneDeep(sections);
                question.sections.forEach(section => {
                    delete section.id;
                    const enableWhen = section.enableWhen;
                    if (enableWhen) {
                        delete enableWhen[0].id;
                    }
                    section.questions = section.questions.map(({ id, required }) => ({ id, required }));
                });
            }
            return question;
        });
        const newSurvey = _.cloneDeep(clientSurvey);
        newSurvey.questions = questions;
        delete newSurvey.sections;
        return newSurvey;
    }
};
