'use strict';

module.exports = [{
    name: 'id and other fields together',
    questions: [{
        id: 1,
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Is it true?',
        type: 'bool'
    }]
}, {
    name: 'type text has choices',
    questions: [{
        text: 'What is this?',
        type: 'text',
        choices: [
            { text: 'Black' },
            { text: 'Brown' }
        ]
    }, {
        text: 'Is it true?',
        type: 'bool'
    }]
}, {
    name: 'type bool has choices',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Is it true?',
        type: 'bool',
        choices: [
            { text: 'Black' },
            { text: 'Brown' }
        ]
    }]
}, {
    name: 'type text has oneOfChoices',
    questions: [{
        text: 'What is this?',
        type: 'text',
        oneOfChoices: ['Black', 'Brown']
    }, {
        text: 'Is it true?',
        type: 'bool'
    }]
}, {
    name: 'type bool has oneOfChoices',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Is it true?',
        type: 'bool',
        oneOfChoices: ['Black', 'Brown']
    }]
}, {
    name: 'choices has no choices',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Choice',
        type: 'choices'
    }]
}, {
    name: 'choices has one of choices',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Choice',
        type: 'choices',
        oneOfChoices: ['Black', 'Brown']
    }]
}, {
    name: 'choices has invalid type',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Choice',
        type: 'choices',
        choices: [
            { text: 'Black', type: 'what' },
            { text: 'Brown' }
        ]
    }]
}, {
    name: 'choice has invalid type',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Choice',
        type: 'choice',
        choices: [
            { text: 'Black', type: 'bool' },
            { text: 'Brown' }
        ]
    }]
}, {
    name: 'choice has no choices',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Choice',
        type: 'choice'
    }]
}, {
    name: 'choice has both oneOfChoice and choices',
    questions: [{
        text: 'What is this?',
        type: 'text'
    }, {
        text: 'Choice',
        type: 'choice',
        oneOfChoices: ['Black', 'Brown'],
        choices: [
            { text: 'Black' },
            { text: 'Brown' }
        ]
    }]
}];
