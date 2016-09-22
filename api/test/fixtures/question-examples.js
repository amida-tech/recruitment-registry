'use strict';

module.exports = [{
    text: 'Which sports do you like?',
    type: 'choices',
    choices: [
        'Football',
        'Basketball',
        'Soccer',
        'Tennis'
    ]
}, {
    text: 'What is your hair color?',
    type: 'choice',
    choices: [
        'Black',
        'Brown',
        'Blonde',
        'Other'
    ]
}, {
    text: 'Where were you born?',
    type: 'text'
}, {
    text: 'Do you have pets?',
    type: 'bool'
}, {
    text: 'How did you hear about us?',
    type: 'choicesplus',
    choices: [
        'TV',
        'Newspaper',
        'Internet',
        'Friends'
    ],
    additionalText: 'Other'
}];
