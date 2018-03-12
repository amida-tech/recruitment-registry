'use strict';

module.exports = [{
    skipAnswering: true,
    missingSurveys: [8, 10, 11, 12, 14, 16, 17, 18],
}, {
    status: 'in-progress',
    missingSurveys: [8, 10, 11, 12, 14, 16, 17, 18],
    surveyIndex: 2,
    noAnswers: [0, 6],
    specialAnswers: [{
        type: 'samerule',
        questionIndex: 2,
        ruleQuestionIndex: 3,
    }, {
        type: 'differentrulesurvey',
        questionIndex: 4,
        ruleSurveyIndex: 8,
    }],
}, {
    status: 'completed',
    noAnswers: [2, 3, 4],
    missingSurveys: [8, 10, 11, 12, 14, 16, 17, 18],
    surveyIndex: 2,
}, {
    status: 'completed',
    missingSurveys: [10, 11, 12, 14, 16, 17, 18],
    surveyIndex: 2,
    noAnswers: [2, 3],
    specialAnswers: [{
        type: 'samerulesurvey',
        questionIndex: 4,
        ruleSurveyIndex: 8,
    }],
}, {
    status: 'completed',
    missingSurveys: [12, 14, 16, 17, 18],
    surveyIndex: 9,
    noAnswers: [4],
    specialAnswers: [{
        type: 'differentrulesurvey',
        questionIndex: 3,
        ruleSurveyIndex: 10,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 18],
    surveyIndex: 9,
    specialAnswers: [{
        type: 'samerulesurvey',
        questionIndex: 3,
        ruleSurveyIndex: 10,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 18],
    surveyIndex: 13,
    noAnswers: [0, 1, 5, 6],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 16, 17, 18],
    surveyIndex: 13,
    noAnswers: [0, 2, 3, 4, 5, 7],
    specialAnswers: [{
        type: 'samerulesurveymulti',
        questionIndex: 1,
        ruleSurveyIndex: 14,
        ruleIndex: 0,
    }, {
        type: 'samerulesurveymulti',
        questionIndex: 6,
        ruleSurveyIndex: 14,
        ruleIndex: 1,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 16, 17, 18],
    surveyIndex: 13,
    noAnswers: [0, 2, 3, 4, 5, 7],
    specialAnswers: [{
        type: 'differentrulesurveymulti',
        questionIndex: 1,
        ruleSurveyIndex: 14,
        ruleIndex: 0,
    }, {
        type: 'differentrulesurveymulti',
        questionIndex: 6,
        ruleSurveyIndex: 14,
        ruleIndex: 1,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 18],
    surveyIndex: 13,
    noAnswers: [0, 2, 3, 4, 5, 7],
    specialAnswers: [{
        type: 'differentrulesurveymulti',
        questionIndex: 1,
        ruleSurveyIndex: 14,
        ruleIndex: 0,
    }, {
        type: 'samerulesurveymulti',
        questionIndex: 6,
        ruleSurveyIndex: 14,
        ruleIndex: 1,
    }],
}];
