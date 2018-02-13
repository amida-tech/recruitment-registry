'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = [{
    text: 'Example',
    type: 'choice',
    oneOfChoices: ['a', 'b', 'c'],
}, {
    text: 'Example',
    type: 'text',
}, {
    text: 'Example',
    type: 'date',
}, {
    text: 'Example',
    type: 'bool',
}, {
    text: 'Example',
    type: 'choice',
    choices: [{ text: 'x' }, { text: 'y' }],
}, {
    text: 'Example',
    type: 'choices',
    choices: [{ text: 'x' }, { text: 'y', type: 'bool' }, { text: 'z', type: 'text' }],
}, {
    text: 'Example',
    type: 'scale',
    scaleLimits: { min: 4, max: 9 },
}];
