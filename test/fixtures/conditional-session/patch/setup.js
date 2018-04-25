'use strict';

const surveys = require('../../example/survey');

module.exports = [{
     // Survey 0
    surveyIndex: 0,
    purpose: 'enableWhen',
    questionIndex: 5,
    type: 'text',
    logic: 'not-equals',
    relativeIndex: 1,
}, {
    surveyIndex: 0,
    purpose: 'type',
    questionIndex: 0,
    type: 'bool',
    isIdentifying: true,
}, { // Survey 1
    surveyIndex: 1,
    purpose: 'type',
    questionIndex: 1,
    type: 'choice',
}, {
    surveyIndex: 1,
    purpose: 'enableWhenMulti',
    questionIndex: 3,
    rules: [{
        logic: 'equals',
        relativeIndex: 2,
        choiceIndex: 1,
    }, {
        logic: 'equals',
        relativeIndex: 2,
        choiceIndex: 3,
    }],
}, {
    surveyIndex: 1,
    purpose: 'enableWhen',
    questionIndex: 5,
    logic: 'exists',
    relativeIndex: 3,
}, { // Survey 2
    surveyIndex: 2,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'exists',
    answerSurveyIndex: 1,
    answerQuestionIndex: 4,
}, { // Survey 3
    surveyIndex: 3,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'not-exists',
    answerSurveyIndex: 0,
    answerQuestionIndex: 3,
}, { // Survey 4
    surveyIndex: 4,
    surveyLevel: true,
    purpose: 'surveyEnableWhenMulti',
    multiInfos: [{
        logic: 'equals',
        answerSurveyIndex: 1,
        answerQuestionIndex: 1,
    }, {
        logic: 'not-equals',
        answerSurveyIndex: 0,
        answerQuestionIndex: 5,
    }],
}, { // Survey 5
    surveyIndex: 5,
    purpose: 'type',
    questionIndex: 1,
    type: 'choice',
}, {
    surveyIndex: 5,
    purpose: 'type',
    questionIndex: 3,
    type: 'choice',
}, { // Survey 6
    surveyIndex: 6,
    purpose: 'type',
    questionIndex: 3,
    type: 'choice',
    choiceCount: 5,
}, {
    surveyIndex: 6,
    purpose: 'type',
    questionIndex: 4,
    type: 'scale',
    scaleLimits: {
        min: 4,
        max: 5,
    },
}, {
    surveyIndex: 6,
    purpose: 'type',
    questionIndex: 5,
    type: 'scale',
    scaleLimits: {
        min: 0,
        max: 1,
    },
}, { // Survey 7
    purpose: 'completeSurvey',
    surveyIndex: 7,
    survey: surveys.travelSurvey,
    surveyLevel: true,
}, { // Survey 8
    surveyIndex: 8,
    purpose: 'type',
    questionIndex: 3,
    type: 'choices',
    choiceCount: 8,
}, {
    surveyIndex: 8,
    purpose: 'enableWhen',
    questionIndex: 5,
    logic: 'equals',
    relativeIndex: 2,
}, { // Survey 9
    surveyIndex: 9,
    purpose: 'type',
    questionIndex: 2,
    type: 'choices',
    choiceCount: 0,
}, {
    surveyIndex: 9,
    purpose: 'type',
    questionIndex: 5,
    type: 'choice',
    choiceCount: 0,
}];
