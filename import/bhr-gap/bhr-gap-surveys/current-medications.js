'use strict';

module.exports = {
    name: 'CurrentMedications',
    identifier: {
        type: 'bhr-gap',
        value: 'current-medications',
    },
    questions: [{
        text: 'Are you currently taking any of the following medications?',
        required: false,
        type: 'choices',
        choices: [
            { text: 'Risperidone (Risperdal)', answerIdentifier: { type: 'bhr-gap-current-meds-column', value: 'QID9_1' } },
            { text: 'Paliperidone (Invega)', answerIdentifier: { type: 'bhr-gap-current-meds-column', value: 'QID9_2' } },
            { text: 'Olanzapine (Zyprexa)', answerIdentifier: { type: 'bhr-gap-current-meds-column', value: 'QID9_3' } },
            { text: 'Quetiapine Fumate (Seroquel)', answerIdentifier: { type: 'bhr-gap-current-meds-column', value: 'QID9_4' } },
            { text: 'Aripiprazole (Abilify)', answerIdentifier: { type: 'bhr-gap-current-meds-column', value: 'QID9_5' } },
        ],
    }, {
        text: 'Are you currently taking any additional medications?',
        required: true,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-current-meds-column', value: 'QID6' },
        choiceSetReference: 'yes-no-1-2',
        //skip: {
        //    count: 2,
        //    rule: {
        //        logic: 'not-equals',
        //        answer: { code: '1' }
        //    }
        //}
    }, {
        text: 'Please list the Medications you are currently taking.',
        instruction: 'Medication',
        required: false,
        type: 'text',
        multiple: true,
        maxCount: 9,
        answerIdentifiers: {
            type: 'bhr-gap-current-meds-column',
            values: ['QID1_1_TEXT', 'QID1_3_TEXT', 'QID3_1_TEXT', 'QID3_3_TEXT', 'QID3_5_TEXT', 'QID5_1_TEXT', 'QID5_3_TEXT', 'QID5_5_TEXT', 'QID5_7_TEXT'],
        },
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-exists'
        //    }
        //}
    }, {
        text: 'For what disease or condition do you take the medication?',
        required: false,
        type: 'text',
        multiple: true,
        maxCount: 9,
        answerIdentifiers: {
            type: 'bhr-gap-current-meds-column',
            values: ['QID1_2_TEXT', 'QID1_4_TEXT', 'QID3_2_TEXT', 'QID3_4_TEXT', 'QID3_6_TEXT', 'QID5_2_TEXT', 'QID5_4_TEXT', 'QID5_6_TEXT', 'QID5_8_TEXT'],
        },
    }, {
        text: 'Are you currently taking any vitamins or supplements?',
        required: false,
        type: 'choice-ref',
        choiceSetReference: 'yes-no-1-2',
        answerIdentifier: { type: 'bhr-gap-current-meds-column', value: 'QID10' },
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-equals',
        //        answer: { code: '1' }
        //    }
        //}
    }, {
        text: 'Please list any vitamins or supplements you are currently taking?',
        required: true,
        type: 'text',
        multiple: true,
        maxCount: 10,
        answerIdentifiers: {
            type: 'bhr-gap-current-meds-column',
            values: ['QID11_1_TEXT', 'QID11_2_TEXT', 'QID11_3_TEXT', 'QID11_4_TEXT', 'QID11_5_TEXT', 'QID11_6_TEXT', 'QID11_7_TEXT', 'QID11_8_TEXT', 'QID11_9_TEXT', 'QID11_10_TEXT'],
        },
    }],
};
