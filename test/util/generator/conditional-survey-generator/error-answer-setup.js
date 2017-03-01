'use strict';

module.exports = [{
    surveyIndex: 1,
    caseIndex: 0,
    specialAnswers: [{
        type: 'differentrule',
        questionIndex: 4,
        ruleQuestionIndex: 5
    }],
    noAnswers: [5],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 1,
    caseIndex: 1,
    questionIndex: 4,
    specialAnswers: [{
        type: 'samerule',
        questionIndex: 4,
        ruleQuestionIndex: 5
    }],
    noAnswers: [],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 2,
    caseIndex: 0,
    specialAnswers: [{
        type: 'samerule',
        questionIndex: 2,
        ruleQuestionIndex: 3
    }],
    noAnswers: [3],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 2,
    caseIndex: 1,
    specialAnswers: [{
        type: 'differentrule',
        questionIndex: 2,
        ruleQuestionIndex: 3
    }],
    noAnswers: [],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 3,
    caseIndex: 0,
    noAnswers: [3, 6],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 3,
    caseIndex: 1,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 3
    }],
    noAnswers: [4],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 3,
    caseIndex: 2,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 3
    }],
    noAnswers: [4],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 4,
    caseIndex: 0,
    noAnswers: [5],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 4,
    caseIndex: 1,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 5
    }],
    noAnswers: [6],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 4,
    caseIndex: 2,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 5
    }],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 5,
    caseIndex: 0,
    noAnswers: [3, 4],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 5,
    caseIndex: 1,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 3
    }],
    noAnswers: [5],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 5,
    caseIndex: 2,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 3
    }],
    noAnswers: [4],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 6,
    caseIndex: 0,
    noAnswers: [0],
    error: 'answerRequiredMissing'
}, {
    surveyIndex: 6,
    caseIndex: 1,
    noAnswers: [],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 7,
    caseIndex: 0,
    noAnswers: [2],
    error: 'answerToBeSkippedAnswered'
}, {
    surveyIndex: 7,
    caseIndex: 1,
    noAnswers: [4],
    error: 'answerRequiredMissing'
}];
