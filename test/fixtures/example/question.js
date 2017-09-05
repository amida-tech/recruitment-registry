'use strict';

module.exports = [{
    text: 'Which sports do you like?',
    type: 'choices',
    choices: [
        { text: 'Football' },
        { text: 'Basketball', type: 'bool' },
        { text: 'Soccer' },
        { text: 'Tennis', type: 'bool' },
    ],
}, {
    text: 'What is your hair color?',
    type: 'choice',
    oneOfChoices: [
        'Black',
        'Brown',
        'Blonde',
        'Other',
    ],
}, {
    text: 'Where were you born?',
    type: 'text',
}, {
    text: 'Do you have pets?',
    type: 'bool',
}, {
    text: 'How did you hear about us?',
    type: 'choices',
    choices: [
        { text: 'TV' },
        { text: 'Newspaper' },
        { text: 'Internet', type: 'bool' },
        { text: 'Friends', type: 'bool' },
        { text: 'Other', type: 'text' },
    ],
}];
