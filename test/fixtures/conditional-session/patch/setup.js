'use strict';

module.exports = [{
    surveyIndex: 0,
    purpose: 'enableWhen',
    questionIndex: 5,
    type: 'text',
    logic: 'not-equals',
    relativeIndex: 1,
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
}];
