'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = [{
    name: 'id and other fields together',
    questions: [{
        id: 1,
        required: true,
        text: 'What is this?',
        type: 'text',
    }, {
        text: 'Is it true?',
        required: false,
        type: 'bool',
    }],
}, {
    name: 'type text has choices',
    questions: [{
        text: 'What is this?',
        required: true,
        type: 'text',
        choices: [
            { text: 'Black' },
            { text: 'Brown' },
        ],
    }, {
        text: 'Is it true?',
        required: false,
        type: 'bool',
    }],
}, {
    name: 'type bool has choices',
    questions: [{
        text: 'What is this?',
        required: true,
        type: 'text',
    }, {
        text: 'Is it true?',
        required: false,
        type: 'bool',
        choices: [
            { text: 'Black' },
            { text: 'Brown' },
        ],
    }],
}, {
    name: 'type text has oneOfChoices',
    questions: [{
        text: 'What is this?',
        required: true,
        type: 'text',
        oneOfChoices: ['Black', 'Brown'],
    }, {
        text: 'Is it true?',
        required: false,
        type: 'bool',
    }],
}, {
    name: 'type bool has oneOfChoices',
    questions: [{
        text: 'What is this?',
        required: false,
        type: 'text',
    }, {
        text: 'Is it true?',
        required: true,
        type: 'bool',
        oneOfChoices: ['Black', 'Brown'],
    }],
}, {
    name: 'choices has no choices',
    questions: [{
        text: 'What is this?',
        required: false,
        type: 'text',
    }, {
        text: 'Choice',
        required: true,
        type: 'choices',
    }],
}, {
    name: 'choices has one of choices',
    questions: [{
        text: 'What is this?',
        required: true,
        type: 'text',
    }, {
        text: 'Choice',
        required: false,
        type: 'choices',
        oneOfChoices: ['Black', 'Brown'],
    }],
}, {
    name: 'choice has invalid type',
    questions: [{
        text: 'What is this?',
        required: false,
        type: 'text',
    }, {
        text: 'Choice',
        required: false,
        type: 'choice',
        choices: [
            { text: 'Black', type: 'bool' },
            { text: 'Brown' },
        ],
    }],
}, {
    name: 'choice has no choices',
    questions: [{
        text: 'What is this?',
        required: true,
        type: 'text',
    }, {
        text: 'Choice',
        required: false,
        type: 'choice',
    }],
}, {
    name: 'choice has both oneOfChoice and choices',
    questions: [{
        text: 'What is this?',
        required: true,
        type: 'text',
    }, {
        text: 'Choice',
        required: false,
        type: 'choice',
        oneOfChoices: ['Black', 'Brown'],
        choices: [
            { text: 'Black' },
            { text: 'Brown' },
        ],
    }],
}];
