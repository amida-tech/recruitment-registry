'use strict';

module.exports = [{
    name: 'choices has invalid type',
    questions: [{
        text: 'What is this?',
        required: true,
        type: 'text',
    }, {
        text: 'Choice',
        required: true,
        type: 'choices',
        choices: [
            { text: 'Black', type: 'what' },
            { text: 'Brown' },
        ],
    }],
}];
