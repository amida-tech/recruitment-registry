'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = {
    name: 'Employment History',
    identifier: {
        type: 'bhr-unit-test',
        value: 'employment-history',
    },
    questions: [{
        text: 'How do you rate the condition of the building that you work?',
        required: false,
        isIdentifying: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'employment-history', value: 'QID1' },
        choiceSetReference: 'condition',
    }, {
        text: 'What is the field of your current job?',
        required: true,
        isIdentifying: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'employment-history', value: 'QID2' },
        choiceSetReference: 'primary-occupation',
    }, {
        text: 'Please indicate other field occupation?',
        required: false,
        isIdentifying: false,
        type: 'text',
        answerIdentifier: { type: 'employment-history', value: 'QID3' },
        enableWhen: [{
            questionIndex: 1,
            logic: 'not-equals',
            answer: { code: '20' },
        }],
    }, {
        text: 'Please indicate your role in your current job',
        required: false,
        isIdentifying: false,
        type: 'choices',
        choices: [
            { text: 'Management', answerIdentifier: { type: 'employment-history', value: 'QID4_1' } },
            { text: 'Administrative', answerIdentifier: { type: 'employment-history', value: 'QID4_2' } },
            { text: 'Support', answerIdentifier: { type: 'employment-history', value: 'QID184_5' } },
            { text: 'Professional', answerIdentifier: { type: 'employment-history', value: 'QID184_7' } },
            { text: 'Consultant', answerIdentifier: { type: 'employment-history', value: 'QID184_9' } },
            { text: 'Other', answerIdentifier: { type: 'employment-history', value: 'QID184_13' } },
        ],
    }],
};
