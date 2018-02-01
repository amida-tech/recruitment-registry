'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = [{
    text: 'Example',
    type: 'choice',
    oneOfChoices: ['a', 'b', 'c'],
    choices: [{ text: 'x' }, { text: 'y', type: 'bool' }],
}, {
    text: 'Example',
    type: 'choices',
}, {
    text: 'Example',
    type: 'choice',
}, {
    text: 'Example',
    type: 'choice',
    choices: [{ text: 'x' }, { text: 'y', type: 'text' }],
}, {
    text: 'Example',
    type: 'text',
    choices: [{ text: 'x' }, { text: 'y', type: 'bool' }, { text: 'z', type: 'text' }],
}, {
    text: 'Example',
    type: 'text',
    oneOfChoices: ['a', 'b', 'c'],
}, {
    text: 'Example',
    type: 'scale',
}];
