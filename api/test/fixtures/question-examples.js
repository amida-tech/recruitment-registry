'use strict';

module.exports = [{
    text: 'Which sports do you like?',
    type: 'choices',
    selectable: false,
    choices: [
        { text: 'Football' },
        { text: 'Basketball', type: 'bool' },
        { text: 'Soccer' },
        { text: 'Tennis', type: 'bool' }
    ],
    actions: [
        { text: 'Go there', type: 'yes' },
        { text: 'Go here', type: 'no' },
        { text: 'Go everywhere', type: 'yes' }
    ]
}, {
    text: 'What is your hair color?',
    type: 'choice',
    selectable: true,
    oneOfChoices: [
        'Black',
        'Brown',
        'Blonde',
        'Other'
    ],
    actions: [
        { text: 'Yesss', type: 'yes' },
        { text: 'Huraaa', type: 'no' }
    ]
}, {
    text: 'Where were you born?',
    selectable: false,
    type: 'text'
}, {
    text: 'Do you have pets?',
    selectable: false,
    type: 'bool'
}, {
    text: 'How did you hear about us?',
    selectable: false,
    type: 'choices',
    choices: [
        { text: 'TV' },
        { text: 'Newspaper' },
        { text: 'Internet', type: 'bool' },
        { text: 'Friends', type: 'bool' },
        { text: 'Other', type: 'text' }
    ]
}];
