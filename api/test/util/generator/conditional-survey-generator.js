'use strict';

const _ = require('lodash');

const SurveyGenerator = require('./survey-generator');
const Answerer = require('./answerer');

const defaultConditionalQuestions = {
    '0-3': { type: 'choice', logic: 'equals', count: 3 },
    '1-5': { type: 'choice', logic: 'not-equals', count: 1 },
    '2-3': { type: 'bool', logic: 'not-equals', count: 2 },
    '3-0': { type: 'text', logic: 'exists', count: 1 },
    '4-2': { type: 'text', logic: 'not-exists', count: 2 },
    '5-2': { type: 'choices', logic: 'equals', count: 1 }

};

const defaultRequiredOverrides = {
    '0-3': false,
    '0-4': true,
    '0-5': false,
    '0-6': true,
    '1-5': true,
    '1-6': true,
    '2-3': true,
    '2-4': false,
    '2-5': true,
    '3-0': true,
    '3-1': true,
    '4-2': false,
    '4-3': false,
    '4-4': true,
    '5-2': false,
    '5-3': true
};

const errorAnswerSetup = [{
    surveyIndex: 0,
    caseIndex: 0,
    questionIndex: 3,
    noAnswers: [3, 6],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 0,
    caseIndex: 1,
    questionIndex: 3,
    skipCondition: false,
    noAnswers: [4],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 0,
    caseIndex: 2,
    questionIndex: 3,
    skipCondition: true,
    noAnswers: [4],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 1,
    caseIndex: 0,
    questionIndex: 5,
    noAnswers: [5],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 1,
    caseIndex: 1,
    questionIndex: 5,
    noAnswers: [6],
    skipCondition: true,
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 1,
    caseIndex: 2,
    questionIndex: 5,
    skipCondition: false,
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 2,
    caseIndex: 0,
    questionIndex: 3,
    noAnswers: [3, 4],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 2,
    caseIndex: 1,
    questionIndex: 3,
    noAnswers: [5],
    skipCondition: true,
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 2,
    caseIndex: 2,
    questionIndex: 3,
    skipCondition: false,
    noAnswers: [4],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 3,
    caseIndex: 0,
    questionIndex: 0,
    noAnswers: [0],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 3,
    caseIndex: 1,
    questionIndex: 0,
    noAnswers: [],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 4,
    caseIndex: 0,
    questionIndex: 2,
    noAnswers: [2],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 4,
    caseIndex: 1,
    questionIndex: 2,
    noAnswers: [4],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 5,
    caseIndex: 0,
    questionIndex: 2,
    noAnswers: [2],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 5,
    caseIndex: 1,
    questionIndex: 2,
    skipCondition: false,
    noAnswers: [3],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 5,
    caseIndex: 2,
    questionIndex: 2,
    skipCondition: true,
    noAnswers: [],
    error: 'answerToBeSkippedAnswered'
}];

module.exports = class ConditionalSurveyGenerator extends SurveyGenerator {
    constructor({ questionGenerator, answerer, conditionalQuestions, requiredOverrides } = {}) {
        super(questionGenerator);
        this.answerer = answerer || new Answerer();
        this.conditionalQuestions = conditionalQuestions || defaultConditionalQuestions;
        this.requiredOverrides = requiredOverrides || defaultRequiredOverrides;
    }

    sectionType() {
        return 0;
    }

    count() {
        return 8;
    }

    addAnswer(rule, questionInfo, question) {
        const logic = questionInfo.logic;
        if (logic === 'equals' || logic === 'not-equals') {
            rule.answer = this.answerer.answerRawQuestion(question);
        }
    }

    newSurveyQuestion(index) {
        const surveyIndex = this.currentIndex();
        const key = `${surveyIndex}-${index}`;
        const questionInfo = this.conditionalQuestions[key];
        let question;
        if (questionInfo) {
            const { type, logic, count } = questionInfo;
            const skip = { rule: {} };
            if (count !== undefined) {
                skip.count = count;
            }
            if (logic !== undefined) {
                skip.rule.logic = logic;
            }
            question = this.questionGenerator.newQuestion(type);
            this.addAnswer(skip.rule, questionInfo, question);
            question.skip = skip;
        } else {
            question = super.newSurveyQuestion(index);
        }
        const requiredOverride = this.requiredOverrides[key];
        if (requiredOverride !== undefined) {
            question.required = requiredOverride;
        }
        return question;
    }

    static conditionalErrorSetup() {
        return errorAnswerSetup;
    }

    answersWithConditions(survey, { questionIndex, skipCondition, noAnswers }) {
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
            }
            const answer = this.answerer.answerQuestion(question);
            r.push(answer);
            return r;
        }, []);
        return answers;
    }

    static newSurveyFromPrevious(clientSurvey, serverSurvey) {
        const questions = serverSurvey.questions.map(({ id, required, skip }) => {
            const question = { id, required };
            if (skip) {
                question.skip = _.cloneDeep(skip);
                delete question.skip.rule.id;
            }
            return question;
        });
        const newSurvey = _.cloneDeep(clientSurvey);
        newSurvey.questions = questions;
        delete newSurvey.sections;
        return newSurvey;
    }
};
