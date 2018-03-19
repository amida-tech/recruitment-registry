'use strict';

const surveys = require('../../example/survey');

module.exports = [{
     // Survey 0
    surveyIndex: 0,
    survey: surveys.travelSurvey,
    surveyLevel: true,
    purpose: 'completeSurvey',
}, { // Survey 1
    surveyIndex: 1,
    questionIndex: 5,
    type: 'text',
    purpose: 'enableWhen',
    logic: 'not-equals',
    relativeIndex: 1,
}, { // Survey 2
    surveyIndex: 2,
    questionIndex: 2,
    type: 'choice',
    purpose: 'type',
}, {
    surveyIndex: 2,
    questionIndex: 4,
    type: 'choice',
    purpose: 'type',
}, {
    surveyIndex: 2,
    questionIndex: 3,
    type: 'choice',
    purpose: 'enableWhen',
    logic: 'equals',
    relativeIndex: 1,
}, { // Survey 3
    surveyIndex: 3,
    questionIndex: 3,
    type: 'choice',
    logic: 'not-equals',
    count: 3,
    purpose: 'questionSection',
}, { // Survey 4
    surveyIndex: 4,
    questionIndex: 5,
    type: 'choice',
    logic: 'equals',
    count: 1,
    purpose: 'questionSection',
}, { // Survey 5
    surveyIndex: 5,
    questionIndex: 3,
    type: 'bool',
    logic: 'equals',
    count: 2,
    purpose: 'questionSection',
}, { // Survey 6
    surveyIndex: 6,
    questionIndex: 0,
    type: 'text',
    logic: 'not-exists',
    count: 1,
    purpose: 'questionSection',
}, { // Survey 7
    surveyIndex: 7,
    questionIndex: 2,
    type: 'text',
    logic: 'exists',
    count: 2,
    purpose: 'questionSection',
}, { // Survey 8
    surveyIndex: 8,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'equals',
    answerSurveyIndex: 2,
    answerQuestionIndex: 4,
}, { // Survey 9
    surveyIndex: 9,
    questionIndex: 3,
    type: 'text',
    purpose: 'type',
}, { // Survey 10
    surveyIndex: 10,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'not-equals',
    answerSurveyIndex: 9,
    answerQuestionIndex: 3,
}, { // Survey 11
    surveyIndex: 11,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'not-exists',
    answerSurveyIndex: 9,
    answerQuestionIndex: 4,
}, { // Survey 12
    surveyIndex: 12,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'exists',
    answerSurveyIndex: 9,
    answerQuestionIndex: 4,
}, { // Survey 13
    surveyIndex: 13,
    questionIndex: 1,
    type: 'choice',
    purpose: 'type',
}, {
    surveyIndex: 13,
    questionIndex: 6,
    type: 'choice',
    purpose: 'type',
}, { // Survey 14
    surveyIndex: 14,
    surveyLevel: true,
    purpose: 'surveyEnableWhenMulti',
    multiInfos: [{
        logic: 'equals',
        answerSurveyIndex: 13,
        answerQuestionIndex: 1,
    }, {
        logic: 'not-equals',
        answerSurveyIndex: 13,
        answerQuestionIndex: 6,
    }],
}, {
    // Survey 15
    surveyIndex: 15,
    purpose: 'type',
    questionIndex: 0,
    type: 'date',
}, {
    surveyIndex: 15,
    purpose: 'type',
    questionIndex: 1,
    type: 'date',
}, {
    surveyIndex: 15,
    purpose: 'type',
    questionIndex: 2,
    type: 'date',
}, {
    surveyIndex: 15,
    purpose: 'enableWhen',
    questionIndex: 4,
    logic: 'in-date-range',
    relativeIndex: 4,
    dateRange: {
        minNumberDays: -30,
    },
}, {
    surveyIndex: 15,
    purpose: 'enableWhen',
    questionIndex: 5,
    logic: 'in-date-range',
    relativeIndex: 4,
    dateRange: {
        maxNumberDays: 30,
    },
}, {
    surveyIndex: 15,
    purpose: 'enableWhen',
    questionIndex: 6,
    logic: 'in-date-range',
    relativeIndex: 4,
    dateRange: {
        minNumberDays: -20,
        maxNumberDays: 20,
    },
}, { // Survey 16
    surveyIndex: 16,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'in-date-range',
    answerSurveyIndex: 15,
    answerQuestionIndex: 0,
    dateRange: {
        minNumberDays: -20,
        maxNumberDays: 20,
    },
}, { // Survey 17
    surveyIndex: 17,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'in-date-range',
    answerSurveyIndex: 15,
    answerQuestionIndex: 1,
    dateRange: {
        maxNumberDays: 30,
    },
}, { // Survey 18
    surveyIndex: 18,
    surveyLevel: true,
    purpose: 'surveyEnableWhen',
    logic: 'in-date-range',
    answerSurveyIndex: 15,
    answerQuestionIndex: 1,
    dateRange: {
        minNumberDays: -30,
    },
}];
