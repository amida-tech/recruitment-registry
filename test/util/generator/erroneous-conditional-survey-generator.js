'use strict';

const ConditionalSurveyGenerator = require('./conditional-survey-generator');

const conditionalQuestions = {
    '0-3': { type: 'choice', logic: 'equals', count: 3 },
    '1-5': { type: 'integer', logic: 'not-equals', count: 1 },
    '2-3': { type: 'bool', logic: 'equals', count: 2 },
    '3-1': { type: 'bool' },
    '4-0': { type: 'choice', logic: 'equals' },
    '5-1': { type: 'bool', logic: 'equals', count: 1, skipAnswer: true },
    '6-2': { type: 'text', logic: 'exists', count: 1, skipAnswer: false },
    '7-3': { type: 'integer', logic: 'not-exists', count: 1, skipAnswer: false }
};

const requiredOverrides = {
    '0-3': false,
    '1-5': true,
    '2-3': true,
    '3-1': false,
    '4-0': true,
    '5-1': false,
    '6-2': true,
    '7-3': false
};

const counts = [5, 6, 5, 3, 3, 3, 4, 5];

const expectedErrors = [{
    code: 'skipValidationNotEnoughQuestions',
    params: [3, 3, 1]
}, {
    code: 'skipValidationNotEnoughQuestions',
    params: [1, 5, 0]
}, {
    code: 'skipValidationNotEnoughQuestions',
    params: [2, 3, 1]
}, {
    code: 'skipValidationNoLogic',
    params: [1],
    apiOverride: 'Request validation failed: Parameter (newSurvey) failed schema validation'
}, {
    code: 'skipValidationNoCount',
    params: [0],
    apiOverride: 'Request validation failed: Parameter (newSurvey) failed schema validation'
}, {
    code: 'skipValidationNoAnswerSpecified',
    params: [1, 'equals']
}, {
    code: 'skipValidationAnswerSpecified',
    params: [2, 'exists']
}, {
    code: 'skipValidationAnswerSpecified',
    params: [3, 'not-exists']
}];

module.exports = class ErroneousConditionalSurveyGenerator extends ConditionalSurveyGenerator {
    constructor() {
        super({ conditionalQuestions, requiredOverrides });
    }

    numOfCases() {
        return counts.length;
    }

    addAnswer(rule, questionInfo, question) {
        if (questionInfo.skipAnswer === true) {
            return;
        }
        const logic = questionInfo.logic;
        if (questionInfo.skipAnswer === false || logic === 'equals' || logic === 'not-equals') {
            rule.answer = this.answerer.answerRawQuestion(question);
        }
    }

    count() {
        const surveyIndex = this.currentIndex();
        return counts[surveyIndex];
    }

    expectedError(index) {
        return expectedErrors[index];
    }
};
