'use strict';

exports.rrErrors = [{
    input: {
        text: 'Example',
        type: 'choice',
        selectable: false,
        oneOfChoices: ['a', 'b', 'c'],
        choices: [{ text: 'x' }, { text: 'y', type: 'bool' }]
    },
    code: 'qxCreateChoicesBoth'
}, {
    input: {
        text: 'Example',
        type: 'choices',
        selectable: false
    },
    code: 'qxCreateChoicesNone'
}, {
    input: {
        text: 'Example',
        type: 'choice',
        selectable: false
    },
    code: 'qxCreateChoiceNone'
}, {
    input: {
        text: 'Example',
        type: 'choice',
        selectable: false,
        choices: [{ text: 'x' }, { text: 'y', type: 'text' }]
    },
    code: 'qxCreateChoiceNotBool'
}, {
    input: {
        text: 'Example',
        type: 'text',
        selectable: false,
        choices: [{ text: 'x' }, { text: 'y', type: 'bool' }, { text: 'z', type: 'text' }]
    },
    code: 'qxCreateChoicesOther'
}, {
    input: {
        text: 'Example',
        type: 'text',
        selectable: false,
        oneOfChoices: ['a', 'b', 'c'],
    },
    code: 'qxCreateChoicesOther'
}];
