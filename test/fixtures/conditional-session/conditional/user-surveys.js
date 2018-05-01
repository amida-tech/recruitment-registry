'use strict';

module.exports = [{
    skipAnswering: true,
    missingSurveys: [8, 10, 11, 12, 14, 16, 17, 18, 20, 21, 22],
}, {
    status: 'in-progress',
    missingSurveys: [8, 10, 11, 12, 14, 16, 17, 18, 20, 21, 22],
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
    missingSurveys: [8, 10, 11, 12, 14, 16, 17, 18, 20, 21, 22],
    surveyIndex: 2,
}, {
    status: 'completed',
    missingSurveys: [10, 11, 12, 14, 16, 17, 18, 20, 21, 22],
    surveyIndex: 2,
    noAnswers: [2, 3],
    specialAnswers: [{
        type: 'samerulesurvey',
        questionIndex: 4,
        ruleSurveyIndex: 8,
    }],
}, {
    status: 'completed',
    missingSurveys: [12, 14, 16, 17, 18, 20, 21, 22],
    surveyIndex: 9,
    noAnswers: [4],
    specialAnswers: [{
        type: 'differentrulesurvey',
        questionIndex: 3,
        ruleSurveyIndex: 10,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 18, 20, 21, 22],
    surveyIndex: 9,
    specialAnswers: [{
        type: 'samerulesurvey',
        questionIndex: 3,
        ruleSurveyIndex: 10,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 18, 20, 21, 22],
    surveyIndex: 13,
    noAnswers: [0, 1, 5, 6],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 16, 17, 18, 20, 21, 22],
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
    missingSurveys: [10, 11, 16, 17, 18, 20, 21, 22],
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
    missingSurveys: [10, 11, 14, 16, 17, 18, 20, 21, 22],
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
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 20, 21, 22],
    surveyIndex: 15,
    noAnswers: [2, 4, 5, 6],
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -40,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 20, 21, 22],
    surveyIndex: 15,
    noAnswers: [2, 6],
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: 0,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 20,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 18, 20, 21, 22],
    surveyIndex: 15,
    noAnswers: [2, 6],
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: 0,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: -40,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 17, 20, 21, 22],
    surveyIndex: 15,
    noAnswers: [2, 5, 6],
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: 0,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 20, 21, 22],
    surveyIndex: 15,
    noAnswers: [2, 5, 6],
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: 25,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 20, 21, 22],
    surveyIndex: 15,
    noAnswers: [2, 5, 6],
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -25,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 21],
    surveyIndex: 19,
    specialAnswers: [{
        type: 'asis',
        questionIndex: 4,
        answer: {
            textValue: '90001',
        },
    }, {
        type: 'asis',
        questionIndex: 1,
        answer: {
            textValue: '20055',
        },
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17],
    surveyIndex: 19,
    specialAnswers: [{
        type: 'asis',
        questionIndex: 4,
        answer: {
            textValue: '90052',
        },
    }, {
        type: 'asis',
        questionIndex: 1,
        answer: {
            textValue: '20060',
        },
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 22],
    surveyIndex: 19,
    specialAnswers: [{
        type: 'asis',
        questionIndex: 4,
        answer: {
            textValue: '90053',
        },
    }, {
        type: 'asis',
        questionIndex: 1,
        answer: {
            textValue: '20001',
        },
    }],
}, {
    status: 'completed',
    missingSurveys: [10, 11, 14, 16, 17, 20, 21, 22],
    surveyIndex: 19,
    specialAnswers: [{
        type: 'asis',
        questionIndex: 4,
        answer: {
            textValue: '90059',
        },
    }, {
        type: 'asis',
        questionIndex: 1,
        answer: {
            textValue: '21001',
        },
    }],
}];
