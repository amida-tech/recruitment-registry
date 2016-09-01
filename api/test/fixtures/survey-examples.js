'use strict';

exports.Example = {
    name: 'Example',
    questions: [{
        text: 'Which sports do you like?',
        type: 'multi-choice-multi',
        choices: [
            'Football',
            'Basketball',
            'Soccer',
            'Tennis'
        ]
    }, {
        text: 'What is your hair color?',
        type: 'multi-choice-single',
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
        text: 'Are you injured?',
        type: 'yes-no'
    }, {
        text: 'Do you have a cat?',
        type: 'yes-no'
    }]
};
