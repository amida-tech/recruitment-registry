'use strict';

module.exports = [{
    surveyIndex: 0,
    purpose: 'enableWhen',
    questionIndex: 5,
    type: 'text',
    logic: 'not-equals',
    relativeIndex: 1,
}, {
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
}];
