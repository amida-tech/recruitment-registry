'use strict';

module.exports = [{
    surveyIndex: 0,
    caseIndex: 0,
    specialAnswers: [{
        type: 'differentrule',
        questionIndex: 4,
        ruleQuestionIndex: 5
    }],
    noAnswers: []
}, {
    surveyIndex: 1,
    caseIndex: 0,
    specialAnswers: [{
        type: 'differentrule',
        questionIndex: 4,
        ruleQuestionIndex: 5
    }],
    noAnswers: []
}, {
    surveyIndex: 1,
    caseIndex: 1,
    specialAnswers: [{
        type: 'samerule',
        questionIndex: 4,
        ruleQuestionIndex: 5
    }],
    noAnswers: [5]
}, {
    surveyIndex: 2,
    caseIndex: 0,
    specialAnswers: [{
        type: 'differentrule',
        questionIndex: 2,
        ruleQuestionIndex: 3
    }],
    noAnswers: [3]
}, {
    surveyIndex: 2,
    caseIndex: 1,
    specialAnswers: [{
        type: 'samerule',
        questionIndex: 2,
        ruleQuestionIndex: 3
    }],
    noAnswers: []
}, {
    surveyIndex: 3,
    caseIndex: 0,
    noAnswers: [3, 4, 5, 6]
}, {
    surveyIndex: 3,
    caseIndex: 1,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 3
    }],
    noAnswers: [5]
}, {
    surveyIndex: 3,
    caseIndex: 2,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 3
    }],
    noAnswers: [4, 5, 6]
}, {
    surveyIndex: 4,
    caseIndex: 0,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 5
    }],
    noAnswers: []
}, {
    surveyIndex: 4,
    caseIndex: 1,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 5
    }],
    noAnswers: [6]
}, {
    surveyIndex: 5,
    caseIndex: 0,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 3
    }],
    noAnswers: [4]
}, {
    surveyIndex: 5,
    caseIndex: 1,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 3
    }],
    noAnswers: [4, 5]
}, {
    surveyIndex: 6,
    caseIndex: 0,
    noAnswers: [1]
}, {
    surveyIndex: 7,
    caseIndex: 0,
    noAnswers: [2, 3, 4]
}, {
    surveyIndex: 7,
    caseIndex: 1,
    noAnswers: [3]
}];
