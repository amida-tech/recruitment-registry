'use strict';

module.exports = {
    name: 'Initial_m18',
    identifier: {
        type: 'bhr-gap',
        value: 'initial-m18',
    },
    questions: [{
        text: 'How often do you use a computer?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID44' },
        choiceSetReference: 'frequency-dwm',
    }, {
        text: 'How confident are you with computers?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID45' },
        choiceSetReference: 'confidence-computer',
    }, {
        text: 'Are you concerned that you have a memory problem?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID1' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Compared to six months ago, how would you rate your memory in general?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID2' },
        choiceSetReference: 'comparative-condition',
    }, {
        text: 'Do you have trouble remembering if you have already told someone something?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID3' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Compared to six months ago, do you have more or less trouble remembering if you have already told someone something?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID4' },
        choiceSetReference: 'comparative-trouble',
    }, {
        text: 'In general, would you say your health is:',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID24' },
        choiceSetReference: 'condition',
    }, {
        text: 'Compared to six months ago, how would you rate your health in general?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID6' },
        choiceSetReference: 'comparative-condition',
    }, {
        text: 'Are you in good spirits most of the time?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID7' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Compared to six months ago, how would you rate your mood in general?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID8' },
        choiceSetReference: 'comparative-condition',
    }, {
        text: 'Have you dropped many of your activities and interests?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID25' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Compared to six months ago, are you pursuing fewer or more activities and interests?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID10' },
        choiceSetReference: 'fewer-more',
    }, {
        text: 'During the past month, did you experience any sleep problems?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID11' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'During the past month, did you take any sleep medications?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID12' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Compared to six months ago, how would you rate your sleep in general?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID13' },
        choiceSetReference: 'comparative-condition',
    }, {
        text: 'How often do you drink alcoholic drinks?',
        instruction: '(1 drink would equal either 4 oz of wine, 12 ounces beer or 1 oz of liquor)',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID14' },
        choiceSetReference: 'drinks-per-day',
    }, {
        text: 'Compared to six months ago, has your consumption of alcohol changed?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID15' },
        choiceSetReference: 'increased-decreased',
    }, {
        text: 'Please indicate whether you currently have or had experienced alcohol abuse in the past.',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID28' },
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
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID29' },
    }, {
        text: 'Please indicate whether you currently have or had experienced drug abuse in the past.',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID30' },
        choiceSetReference: 'yes-no-1-3',
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-equals',
        //        answer: { code: '1' }
        //    }
        //}
    }, {
        text: 'How long has it been in years since you stopped the drug abuse? If you still abuse drugs please write 0.',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID31' },
    }, {
        text: 'Do you have hypertension (high blood pressure)?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID16' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'Do you have diabetes?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID17' },
        choiceSetReference: 'yes-no-1-2',
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
            { text: 'Anti-depressant medication', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID18_1' } },
            { text: 'Anti-anxiety medication', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID18_2' } },
        ],
    }, {
        text: 'How long in months has your current prescription been stable in frequency?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m18-column', values: ['QID32_1', 'QID32_2'] },
    }, {
        text: 'How long in months has your current prescription been stable in dose?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m18-column', values: ['QID33_1', 'QID33_3'] },
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
            { text: 'Donepezil (Aricept)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_1' } },
            { text: 'Tacrine (Cognex)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_2' } },
            { text: 'Rivastigmine (Exelon)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_3' } },
            { text: 'Memantine (Namenda)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_4' } },
            { text: 'Galantamine (Razadyne)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_5' } },
            { text: 'Risperidone (Risperdal)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_6' } },
            { text: 'Paliperidone (Invega)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_7' } },
            { text: 'Olanzapine (Zyprexa)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_8' } },
            { text: 'Quetiapine (Seroquel)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_9' } },
            { text: 'Aripiprazole (Abilify)', answerIdentifier: { type: 'bhr-gap-initial-m18-column', value: 'QID19_10' } },
        ],
    }, {
        text: 'How long in months has your current prescription been stable in frequency?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m18-column', values: ['QID34_1', 'QID35_1', 'QID36_1', 'QID37_1', 'QID38_1', 'QID39_1', 'QID40_1', 'QID41_1', 'QID42_1', 'QID43_1'] },
    }, {
        text: 'How long in months has your current prescription been stable in dose?',
        required: false,
        type: 'integer',
        multiple: true,
        answerIdentifiers: { type: 'bhr-gap-initial-m18-column', values: ['QID34_2', 'QID35_2', 'QID36_2', 'QID37_2', 'QID38_2', 'QID39_2', 'QID40_2', 'QID41_2', 'QID42_2', 'QID43_2'] },
    }],
};
