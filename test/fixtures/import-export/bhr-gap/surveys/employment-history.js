'use strict';

module.exports = {
    name: 'Employment History',
    identifier: {
        type: 'bhr-unit-test',
        value: 'employment-history'
    },
    questions: [{
        text: 'How do you rate the condition of the building that you work?',
        required: false,
        type: 'enumeration',
        answerIdentifier: { type: 'employment-history', value: 'QID1' },
        enumeration: 'condition'
    }, {
        text: 'What is the field of your current job?',
        required: true,
        type: 'enumeration',
        answerIdentifier: { type: 'employment-history', value: 'QID2' },
        enumeration: 'primary-occupation',
        skip: {
            count: 1,
            rule: {
                logic: 'not-equals',
                answer: { integerValue: 20 }
            }
        }
    }, {
        text: 'Please indicate other field occupation?',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'employment-history', value: 'QID3' }
    }, {
        text: 'Please indicate your role in your current job',
        required: false,
        type: 'choices',
        choices: [
            { text: 'Management', answerIdentifier: { type: 'employment-history', value: 'QID4_1' } },
            { text: 'Administrative', answerIdentifier: { type: 'employment-history', value: 'QID4_2' } },
            { text: 'Support', answerIdentifier: { type: 'employment-history', value: 'QID184_5' } },
            { text: 'Professional', answerIdentifier: { type: 'employment-history', value: 'QID184_7' } },
            { text: 'Consultant', answerIdentifier: { type: 'employment-history', value: 'QID184_9' } },
            { text: 'Other', answerIdentifier: { type: 'employment-history', value: 'QID184_13' } }
        ]
    }]
};
