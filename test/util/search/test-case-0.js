'use strict';

const answerSequence = [{ // user 0, survey 0
    userIndex: 0,
    surveyIndex: 0,
    answerInfo: [{
        questionType: 'text',
        value: 'textvalue_00',
    }, {
        questionType: 'bool',
        value: true,
    }, {
        questionType: 'choice',
        choiceIndex: 4,
    }, {
        questionType: 'multitext',
        values: ['mtv_1', 'mtv_2'],
    }],
}, {                      // user 0, survey 1
    userIndex: 0,
    surveyIndex: 1,
    answerInfo: [{
        questionType: 'text',
        value: 'textvalue_10',
    }, {
        questionType: 'bool',
        value: false,
    }, {
        questionType: 'choice',
        choiceIndex: 4,
    }, {
        questionType: 'multichoice',
        choiceIndices: [2, 3, 4],
    }],
}, {                      // user 0, survey 2
    userIndex: 0,
    surveyIndex: 5,
    answerInfo: [{
        questionType: 'date',
        value: '1999-02-02',
    }, {
        questionType: 'choices',
        choiceIndices: [2, 3, 4],
    }],
}, {                  // user 0, survey 5
    userIndex: 0,
    surveyIndex: 2,
    answerInfo: [{
        questionType: 'multichoice',
        choiceIndices: [1, 3, 5],
    }, {
        questionType: 'choices',
        choiceIndices: [0, 2, 4],
    }],
}, {                      // user 1, survey 0
    userIndex: 1,
    surveyIndex: 0,
    answerInfo: [{
        questionType: 'text',
        value: 'textvalue_00',
    }, {
        questionType: 'bool',
        value: false,
    }, {
        questionType: 'choice',
        choiceIndex: 2,
    }, {
        questionType: 'multitext',
        values: ['mtv_1'],
    }],
}, {                      // user 1, survey 1
    userIndex: 1,
    surveyIndex: 1,
    answerInfo: [{
        questionType: 'text',
        value: 'textvalue_102',
    }, {
        questionType: 'bool',
        value: false,
    }, {
        questionType: 'choice',
        choiceIndex: 3,
    }, {
        questionType: 'multichoice',
        choiceIndices: [1, 3],
    }],
}, {                      // user 1, survey 2
    userIndex: 1,
    surveyIndex: 2,
    answerInfo: [{
        questionType: 'text',
        value: 'rm2',
    }, {
        questionType: 'choices',
        choiceIndices: [0, 2, 3],
    }, {
        questionType: 'multichoice',
        choiceIndices: [1, 2],
    }],
}, {                      // user 2, survey 0
    userIndex: 2,
    surveyIndex: 0,
    answerInfo: [{
        questionType: 'text',
        value: 'textvalue_00',
    }, {
        questionType: 'bool',
        value: false,
    }, {
        questionType: 'choice',
        choiceIndex: 5,
    }, {
        questionType: 'multitext',
        values: ['mtv_42', 'mtv_33', 'mtv_5'],
    }],
}, {                      // user 2, survey 1
    userIndex: 2,
    surveyIndex: 1,
    answerInfo: [{
        questionType: 'text',
        value: 'textvalue_102',
    }, {
        questionType: 'bool',
        value: true,
    }, {
        questionType: 'choice',
        choiceIndex: 0,
    }, {
        questionType: 'multichoice',
        choiceIndices: [1, 2, 4],
    }],
}, {                      // user 2, survey 2
    userIndex: 2,
    surveyIndex: 2,
    answerInfo: [{
        questionType: 'text',
        value: 'rm4',
    }, {
        questionType: 'choices',
        choiceIndices: [0, 1],
    }, {
        questionType: 'multichoice',
        choiceIndices: [2, 5],
    }],
}, {                      // user 3, survey 0
    userIndex: 3,
    surveyIndex: 0,
    answerInfo: [{
        questionType: 'text',
        value: 'somethingelse',
    }],
}, {                      // user 3, survey 1
    userIndex: 3,
    surveyIndex: 1,
    answerInfo: [{
        questionType: 'text',
        value: 'textvalue_102',
    }, {
        questionType: 'bool',
        value: true,
    }, {
        questionType: 'choice',
        choiceIndex: 0,
    }, {
        questionType: 'multichoice',
        choiceIndices: [1, 4, 5],
    }],
}, {                      // user 3, survey 2
    userIndex: 3,
    surveyIndex: 2,
    answerInfo: [{
        questionType: 'text',
        value: 'rm4',
    }, {
        questionType: 'choices',
        choiceIndices: [1, 4, 5],
    }, {
        questionType: 'multichoice',
        choiceIndices: [2, 4],
    }],
}, {                      // user 4, survey 0
    userIndex: 4,
    surveyIndex: 0,
    answerInfo: [{
        questionType: 'text',
        value: 'somethingelse',
    }],
}, {                      // user 4, survey 1
    userIndex: 4,
    surveyIndex: 1,
    answerInfo: [{
        questionType: 'multichoice',
        choiceIndices: [5],
    }],
}, {                      // user 4, survey 3
    userIndex: 4,
    surveyIndex: 3,
    answerInfo: [{
        questionType: 'choices',
        choiceIndices: [0, 2],
    }, {
        questionType: 'integer',
        value: 50,
    }],
}, {                      // user 4, survey 0
    userIndex: 5,
    surveyIndex: 0,
    answerInfo: [{
        questionType: 'text',
        value: 'somethingelse2',
    }],
}, {                      // user 4, survey 1
    userIndex: 5,
    surveyIndex: 1,
    answerInfo: [{
        questionType: 'multichoice',
        choiceIndices: [4, 5],
    }],
}, {                      // user 5, survey 3
    userIndex: 5,
    surveyIndex: 3,
    answerInfo: [{
        questionType: 'choices',
        choiceIndices: [0, 1, 3],
    }, {
        questionType: 'integer',
        value: 75,
    }],
}];

const searchCases = [{
    count: 3,
    userIndices: [0, 1, 2],
    answers: [{
        surveyIndex: 0,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_00',
        }],
    }, {
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'multichoice',
            choiceIndices: [2, 3],
        }],
    }],
}, {
    count: 2,
    userIndices: [0, 2],
    answers: [{
        surveyIndex: 0,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_00',
        }],
    }, {
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'multichoice',
            choiceIndices: [2],
        }],
    }],
}, {
    count: 1,
    userIndices: [0],
    answers: [{
        surveyIndex: 5,
        answerInfo: [{
            questionType: 'date',
            rangeValue: { min: '1999-02-01', max: '1999-02-03' },
        }],
    }, {
        surveyIndex: 5,
        answerInfo: [{
            questionType: 'choices',
            choiceIndices: [2, 3],
        }],
    }],
}, {
    count: 1,
    userIndices: [1],
    answers: [{
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'choice',
            choiceIndex: 3,
        }],
    }],
}, {
    count: 2,
    userIndices: [0, 1],
    answers: [{
        surveyIndex: 2,
        answerInfo: [{
            questionType: 'choices',
            choiceIndices: [2, 3],
        }],
    }],
}, {
    count: 2,
    userIndices: [0, 3],
    answers: [{
        surveyIndex: 2,
        answerInfo: [{
            ignoreBoolValue: true,
            questionType: 'choices',
            choiceIndices: [4, 5],
        }],
    }],
}, {
    count: 1,
    userIndices: [4],
    answers: [{
        surveyIndex: 3,
        answerInfo: [{
            questionType: 'integer',
            value: 50,
        }, {
            questionType: 'choices',
            choiceIndices: [0],
        }],
    }],
}, {
    count: 2,
    userIndices: [4, 5],
    answers: [{
        surveyIndex: 3,
        answerInfo: [{
            questionType: 'integer',
            rangeValue: { min: 25, max: 100 },
        }, {
            questionType: 'choices',
            choiceIndices: [0, 2],
        }],
    }],
}, {
    count: 2,
    userIndices: [4, 5],
    answers: [{
        surveyIndex: 3,
        answerInfo: [{
            questionType: 'integer',
            rangeValue: { min: 25 },
        }, {
            questionType: 'choices',
            choiceIndices: [0, 2],
        }],
    }],
}, {
    count: 2,
    userIndices: [4, 5],
    answers: [{
        surveyIndex: 3,
        answerInfo: [{
            questionType: 'integer',
            rangeValue: { max: 100 },
        }, {
            questionType: 'choices',
            choiceIndices: [0, 2],
        }],
    }],
}, {
    count: 1,
    userIndices: [5],
    answers: [{
        surveyIndex: 3,
        answerInfo: [{
            questionType: 'integer',
            rangeValue: { min: 60, max: 100 },
        }, {
            questionType: 'choices',
            choiceIndices: [0, 2],
        }],
    }],
}, {
    count: 3,
    userIndices: [3, 4, 5],
    answers: [{
        surveyIndex: 0,
        answerInfo: [{
            exclude: true,
            questionType: 'text',
            value: 'textvalue_00',
        }],
    }, {
        surveyIndex: 1,
        answerInfo: [{
            exclude: true,
            questionType: 'multichoice',
            choiceIndices: [2, 3],
        }],
    }],
}, {
    count: 2,
    userIndices: [3, 4],
    answers: [{
        surveyIndex: 0,
        answerInfo: [{
            questionType: 'text',
            value: 'somethingelse',
        }],
    }, {
        surveyIndex: 1,
        answerInfo: [{
            exclude: true,
            questionType: 'multichoice',
            choiceIndices: [2, 3],
        }],
    }],
}, {
    count: 0,
    userIndices: [],
    answers: [{
        surveyIndex: 0,
        answerInfo: [{
            questionType: 'text',
            value: 'notanexistinganswer',
        }],
    }, {
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'multichoice',
            choiceIndices: [2, 3],
        }],
    }],
}];

module.exports = {
    answerSequence,
    searchCases,
    emptyCase: searchCases[3],
};
