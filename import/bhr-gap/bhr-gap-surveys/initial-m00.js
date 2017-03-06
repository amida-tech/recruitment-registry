'use strict';

module.exports = {
    name: 'Initial_m00',
    identifier: {
        type: 'bhr-gap',
        value: 'initial-m00',
    },
    questions: [{
        text: 'How often do you use a computer?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID38' },
        choiceSetReference: 'frequency-dwm',
    }, {
        text: 'How confident are you with computers?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID39' },
        choiceSetReference: 'confidence-computer',
    }, {
        text: 'Have you, your sibling(s), or parent(s) ever been diagnosed with Alzheimer\'s Disease?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID4' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Are you concerned that you have a memory problem?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID2' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Do you have trouble remembering if you have already told someone something?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID3' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Compared to 10 years ago, would you say there has been a change in your memory?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID5' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'In general, would you say your health is:',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID20' },
        choiceSetReference: 'condition',
    }, {
        text: 'Compared to one year ago, how would you rate your health in general now?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID7' },
        choiceSetReference: 'comparative-condition',
    }, {
        text: 'Are you in good spirits most of the time?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID8' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Have you dropped many of your activities and interests?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID21' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'During the past month, did you experience any sleep problems?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID10' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'During the past month, did you take any sleep medications?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID11' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Please indicate whether you currently have or had experienced alcohol abuse in the past.',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID22' },
        choiceSetReference: 'yes-no-1-3',
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-equals',
        //        answer: { code: '1' }
        //    }
        //}
    }, {
        text: 'How long has it been in years since your stopped your alcohol abuse? If you still abuse alcohol please write 0.',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID23' },
    }, {
        text: 'How often do you drink alcoholic drinks?',
        instruction: '(1 drink would equal either 4 oz of wine, 12 ounces beer or 1 oz of liquor)',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID12' },
        choiceSetReference: 'drinks-per-day',
    }, {
        text: 'Do you have hypertension (high blood pressure)?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID13' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Do you have diabetes?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID14' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Please indicate whether you currently have or had experienced drug abuse in the past.',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID24' },
        choiceSetReference: 'yes-no-1-3',
    }, {
        text: 'How long has it been in years since you stopped the drug abuse? If you still abuse drugs please write 0.',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID25' },
    }, {
        text: 'Are you currently taking any of the following types of medications?',
        instruction: '(Select all that apply)',
        required: false,
        type: 'choices',
        // skip: {
        //    count: 2,
        //    rule: {
        //        logic: 'each-not-selected'
        //    }
        // },
        choices: [
            { text: 'Anti-depressant medication', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID15_1' } },
            { text: 'Anti-anxiety medication', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID15_2' } },
        ],
    }, {
        text: 'How long in months has your current prescription been stable in frequency?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m00-column', values: ['QID26_1', 'QID26_2'] },
    }, {
        text: 'How long in months has your current prescription been stable in dose?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m00-column', values: ['QID27_1', 'QID27_3'] },
    }, {
        text: 'Are you currently taking any of the following medications?',
        instruction: '(Select all that apply)',
        required: false,
        type: 'choices',
        // skip: {
        //    count: 2,
        //    rule: {
        //        logic: 'each-not-selected'
        //    }
        // },
        choices: [
            { text: 'Donepezil (Aricept)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_1' } },
            { text: 'Tacrine (Cognex)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_2' } },
            { text: 'Rivastigmine (Exelon)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_3' } },
            { text: 'Memantine (Namenda)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_4' } },
            { text: 'Galantamine (Razadyne)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_5' } },
            { text: 'Risperidone (Risperdal)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_6' } },
            { text: 'Paliperidone (Invega)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_7' } },
            { text: 'Olanzapine (Zyprexa)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_8' } },
            { text: 'Quetiapine (Seroquel)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_9' } },
            { text: 'Aripiprazole (Abilify)', answerIdentifier: { type: 'bhr-gap-initial-m00-column', value: 'QID16_10' } },
        ],
    }, {
        text: 'How long in months has your current prescription been stable in frequency?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m00-column', values: ['QID28_1', 'QID29_1', 'QID30_1', 'QID31_1', 'QID32_1', 'QID33_1', 'QID34_1', 'QID35_1', 'QID36_1', 'QID37_1'] },
    }, {
        text: 'How long in months has your current prescription been stable in dose?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m00-column', values: ['QID28_2', 'QID29_2', 'QID30_2', 'QID31_2', 'QID32_2', 'QID33_2', 'QID34_2', 'QID35_2', 'QID36_2', 'QID37_2'] },
    }],
};
