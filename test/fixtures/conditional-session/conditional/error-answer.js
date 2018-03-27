'use strict';

module.exports = [{
    surveyIndex: 0,
    caseIndex: 0,
    noAnswers: [0, 1, 2, 3, 4, 5, 6],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 0,
    caseIndex: 1,
    noAnswers: [1, 2, 3, 4, 5, 6, 7],
    error: 'answerRequiredMissing',
    specialAnswers: [{
        type: 'selectchoice',
        questionIndex: 0,
        selectionChoice: 0,
    }],
}, {
    surveyIndex: 0,
    caseIndex: 2,
    noAnswers: [1, 5, 6, 7],
    error: 'answerToBeSkippedAnswered',
    specialAnswers: [{
        type: 'selectchoice',
        questionIndex: 0,
        selectionChoice: 0,
    }, {
        type: 'selectchoice',
        questionIndex: 2,
        selectionChoice: 1,
    }],
}, {
    surveyIndex: 0,
    caseIndex: 3,
    noAnswers: [1, 3, 4, 5, 6, 7],
    error: 'answerRequiredMissing',
    specialAnswers: [{
        type: 'selectchoice',
        questionIndex: 0,
        selectionChoice: 0,
    }, {
        type: 'selectchoice',
        questionIndex: 2,
        selectionChoice: 1,
    }],
}, {
    surveyIndex: 0,
    caseIndex: 4,
    noAnswers: [1, 3, 4, 5, 6, 7],
    error: 'answerRequiredMissing',
    specialAnswers: [{
        type: 'selectchoice',
        questionIndex: 0,
        selectionChoice: 0,
    }, {
        type: 'selectchoice',
        questionIndex: 2,
        selectionChoice: 0,
    }],
}, {
    surveyIndex: 0,
    caseIndex: 5,
    noAnswers: [1, 2, 3, 4, 5, 6, 7],
    error: 'answerRequiredMissing',
    specialAnswers: [{
        type: 'selectchoice',
        questionIndex: 0,
        selectionChoice: 1,
    }],
}, {
    surveyIndex: 0,
    caseIndex: 6,
    noAnswers: [3, 4, 5, 6, 7],
    error: 'answerToBeSkippedAnswered',
    specialAnswers: [{
        type: 'selectchoice',
        questionIndex: 0,
        selectionChoice: 1,
    }, {
        type: 'selectchoice',
        questionIndex: 1,
        selectionChoice: 1,
    }],
}, {
    surveyIndex: 0,
    caseIndex: 7,
    noAnswers: [2, 3, 4, 6],
    error: 'answerToBeSkippedAnswered',
    specialAnswers: [{
        type: 'selectchoice',
        questionIndex: 0,
        selectionChoice: 1,
    }, {
        type: 'selectchoice',
        questionIndex: 1,
        selectionChoice: 1,
    }, {
        type: 'selectchoice',
        questionIndex: 5,
        selectionChoice: 1,
    }],
}, {
    surveyIndex: 1,
    caseIndex: 0,
    specialAnswers: [{
        type: 'differentrule',
        questionIndex: 4,
        ruleQuestionIndex: 5,
    }],
    noAnswers: [5],
    error: 'answerRequiredMissing',
}, {
    surveyIndex: 1,
    caseIndex: 1,
    specialAnswers: [{
        type: 'samerule',
        questionIndex: 4,
        ruleQuestionIndex: 5,
    }],
    noAnswers: [],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 2,
    caseIndex: 0,
    specialAnswers: [{
        type: 'samerule',
        questionIndex: 2,
        ruleQuestionIndex: 3,
    }],
    noAnswers: [3],
    error: 'answerRequiredMissing',
}, {
    surveyIndex: 2,
    caseIndex: 1,
    specialAnswers: [{
        type: 'differentrule',
        questionIndex: 2,
        ruleQuestionIndex: 3,
    }],
    noAnswers: [],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 3,
    caseIndex: 0,
    noAnswers: [3, 6],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 3,
    caseIndex: 1,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 3,
    }],
    noAnswers: [4],
    error: 'answerRequiredMissing',
}, {
    surveyIndex: 3,
    caseIndex: 2,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 3,
    }],
    noAnswers: [4],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 4,
    caseIndex: 0,
    noAnswers: [5],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 4,
    caseIndex: 1,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 5,
    }],
    noAnswers: [6],
    error: 'answerRequiredMissing',
}, {
    surveyIndex: 4,
    caseIndex: 2,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 5,
    }],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 5,
    caseIndex: 0,
    noAnswers: [3, 4],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 5,
    caseIndex: 1,
    specialAnswers: [{
        type: 'samerulesection',
        questionIndex: 3,
    }],
    noAnswers: [5],
    error: 'answerRequiredMissing',
}, {
    surveyIndex: 5,
    caseIndex: 2,
    specialAnswers: [{
        type: 'differentrulesection',
        questionIndex: 3,
    }],
    noAnswers: [4],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 6,
    caseIndex: 0,
    noAnswers: [0],
    error: 'answerRequiredMissing',
}, {
    surveyIndex: 6,
    caseIndex: 1,
    noAnswers: [],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 7,
    caseIndex: 0,
    noAnswers: [2],
    error: 'answerToBeSkippedAnswered',
}, {
    surveyIndex: 7,
    caseIndex: 1,
    noAnswers: [4],
    error: 'answerRequiredMissing',
}, {
    surveyIndex: 15,
    caseIndex: 0,
    noAnswers: [1, 2, 5, 6],
    error: 'answerRequiredMissing',
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -10,
    }],
}, {
    surveyIndex: 15,
    caseIndex: 1,
    noAnswers: [5, 6],
    error: 'answerRequiredMissing',
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -10,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 10,
    }, {
        type: 'datenumdays',
        questionIndex: 2,
        numDays: 0,
    }],
}, {
    surveyIndex: 15,
    caseIndex: 2,
    noAnswers: [5, 6],
    error: 'answerRequiredMissing',
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -10,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 10,
    }, {
        type: 'datenumdays',
        questionIndex: 2,
        numDays: 0,
    }],
}, {
    surveyIndex: 15,
    caseIndex: 3,
    noAnswers: [],
    error: 'answerToBeSkippedAnswered',
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -10,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }, {
        type: 'datenumdays',
        questionIndex: 2,
        numDays: 0,
    }],
}, {
    surveyIndex: 15,
    caseIndex: 4,
    noAnswers: [5],
    error: 'answerToBeSkippedAnswered',
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -10,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }, {
        type: 'datenumdays',
        questionIndex: 2,
        numDays: 30,
    }],
}, {
    surveyIndex: 15,
    caseIndex: 5,
    noAnswers: [5],
    error: 'answerToBeSkippedAnswered',
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -10,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }, {
        type: 'datenumdays',
        questionIndex: 2,
        numDays: -30,
    }],
}, {
    surveyIndex: 15,
    caseIndex: 6,
    noAnswers: [5, 6],
    error: 'answerToBeSkippedAnswered',
    specialAnswers: [{
        type: 'datenumdays',
        questionIndex: 0,
        numDays: -40,
    }, {
        type: 'datenumdays',
        questionIndex: 1,
        numDays: 40,
    }, {
        type: 'datenumdays',
        questionIndex: 2,
        numDays: -30,
    }],
}];
