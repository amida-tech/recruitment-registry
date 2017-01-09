'use strict';

module.exports = {
    name: 'Current Medications',
    questions: [{
        text: 'Are you currently taking any of the following medications?',
        required: false,
        type: 'choices',
        choices: [
            { text: 'Risperidone (Risperdal)', answerIdentifier: 'QID9_1' },
            { text: 'Paliperidone (Invega)', answerIdentifier: 'QID9_2' },
            { text: 'Olanzapine (Zyprexa)', answerIdentifier: 'QID9_3' },
            { text: 'Quetiapine Fumate (Seroquel)', answerIdentifier: 'QID9_4' },
            { text: 'Aripiprazole (Abilify)', answerIdentifier: 'QID9_5' }
        ]
    }, {
        text: 'Are you currently taking any additional medications?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID6',
        skip: {
            count: 2,
            rule: {
                logic: 'equals',
                answer: 'Yes'
            }
        },
        choices: [
            { text: 'Yes', numerical: 1 },
            { text: 'No', numerical: 2 }
        ]
    }, {
        text: 'Please list the Medications you are currently taking.',
        instruction: 'Medication',
        required: true,
        type: 'text',
        multiple: true,
        maxCount: 9,
        answerIdentifiers: ['QID1_1_TEXT', 'QID1_3_TEXT', 'QID3_1_TEXT', 'QID3_3_TEXT', 'QID3_5_TEXT', 'QID5_1_TEXT', 'QID5_3_TEXT', 'QID5_5_TEXT', 'QID5_7_TEXT'],
        skip: {
            count: 1,
            rule: {
                logic: 'exists'
            }
        }
    }, {
        text: 'For what disease or condition do you take the medication?',
        required: false,
        type: 'text',
        multiple: true,
        mxCount: 9,
        answerIdentifiers: ['QID1_2_TEXT', 'QID1_4_TEXT', 'QID3_2_TEXT', 'QID3_4_TEXT', 'QID3_6_TEXT', 'QID5_2_TEXT', 'QID5_4_TEXT', 'QID5_6_TEXT', 'QID5_8_TEXT']
    }, {
        text: 'Are you currently taking any vitamins or supplements?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID10',
        skip: {
            count: 1,
            rule: {
                logic: 'equals',
                answer: 'Yes'
            }
        },
        choices: [
            { text: 'Yes', numerical: 1 },
            { text: 'No', numerical: 2 }
        ]
    }, {
        text: 'Please list any vitamins or supplements you are currently taking?',
        required: true,
        type: 'text',
        multiple: true,
        mxCount: 10,
        answerIdentifiers: ['QID11_1_TEXT', 'QID11_2_TEXT', 'QID11_3_TEXT', 'QID11_4_TEXT', 'QID11_5_TEXT', 'QID11_6_TEXT', 'QID11_7_TEXT', 'QID11_8_TEXT', 'QID11_9_TEXT', 'QID11_10_TEXT']
    }]
};
