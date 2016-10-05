'use strict';

exports.rrErrors = [{
    input: {
        text: 'Example',
        type: 'choice',
        oneOfChoices: ['a', 'b', 'c'],
        choices: [{ text: 'x' }, { text: 'y', type: 'bool' }]
    },
    code: 'qxCreateChoicesBoth'
}, {
    input: {
        text: 'Example',
        type: 'choices'
    },
    code: 'qxCreateChoicesNone'
}, {
    input: {
        text: 'Example',
        type: 'choice'
    },
    code: 'qxCreateChoiceNone'
}, {
    input: {
        text: 'Example',
        type: 'choice',
        choices: [{ text: 'x' }, { text: 'y', type: 'text' }]
    },
    code: 'qxCreateChoiceNotBool'
}, {
    input: {
        text: 'Example',
        type: 'text',
        choices: [{ text: 'x' }, { text: 'y', type: 'bool' }, { text: 'z', type: 'text' }]
    },
    code: 'qxCreateChoicesOther'
}, {
    input: {
        text: 'Example',
        type: 'text',
        oneOfChoices: ['a', 'b', 'c'],
    },
    code: 'qxCreateChoicesOther'
}];
