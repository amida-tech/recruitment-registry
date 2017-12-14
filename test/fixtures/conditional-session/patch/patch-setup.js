'use strict';

module.exports = [{
    surveyIndex: 0,
    mods: [{
        questionIndex: 5,
        purpose: 'enableWhenRaw',
        logic: 'equals',
        relativeIndex: 1,
    }],
}, {
    surveyIndex: 0,
    mods: [{
        questionIndex: 5,
        purpose: 'enableWhen',
        logic: 'equals',
        relativeIndex: 1,
    }],
}, {
    surveyIndex: 1,
    mods: [{
        questionIndex: 3,
        purpose: 'deleteEnableWhenElement',
        index: 0,
    }, {
        questionIndex: 5,
        purpose: 'deleteEnableWhen',
    }],
}];
