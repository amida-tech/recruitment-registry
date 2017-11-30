'use strict';

module.exports = [{
    skipAnswering: true,
    missingSurveys: [8, 10, 11, 12],
}, {
    status: 'in-progress',
    missingSurveys: [8, 10, 11, 12],
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
    missingSurveys: [8, 10, 11, 12],
    surveyIndex: 2,
}, {
    status: 'completed',
    missingSurveys: [10, 11, 12],
    surveyIndex: 2,
    noAnswers: [2, 3],
    specialAnswers: [{
        type: 'samerulesurvey',
        questionIndex: 4,
        ruleSurveyIndex: 8,
    }],
}, {
    status: 'completed',
    missingSurveys: [12],
    surveyIndex: 9,
    noAnswers: [4],
    specialAnswers: [{
        type: 'differentrulesurvey',
        questionIndex: 3,
        ruleSurveyIndex: 10,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11],
    surveyIndex: 9,
    specialAnswers: [{
        type: 'samerulesurvey',
        questionIndex: 3,
        ruleSurveyIndex: 10,
    }],
}];
