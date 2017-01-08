'use strict';

module.exports = {
    name: 'Initial_m00',
    questions: [{
        text: 'How often do you use a computer?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID38',
        oneOfchoices: ['Daily', 'Weekly', 'Monthly', 'Almost never']
    }, {
        text: 'How confident are you with computers?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID39',
        oneOfchoices: ['Not confident at all', 'I usually need help', 'It depends on the task', 'Confident']
    }, {
        text: 'Have you, your sibling(s), or parent(s) ever been diagnosed with Alzheimer\'s Disease?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID4',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Are you concerned that you have a memory problem?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID2',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Do you have trouble remembering if you have already told someone something?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID3',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Compared to 10 years ago, would you say there has been a change in your memory?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID5',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'In general, would you say your health is:',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID20',
        oneOfchoices: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
    }, {
        text: 'Compared to one year ago, how would you rate your health in general now?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID7',
        oneOfchoices: ['Much Better', 'Better', 'Same', 'Worse', 'Much Worse']
    }, {
        text: 'Are you in good spirits most of the time?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID8',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Have you dropped many of your activities and interests?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID21',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'During the past month, did you experience any sleep problems?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID10',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'During the past month, did you take any sleep medications?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID11',
        choices: [{ text: 'Yes', numerical: 1 }, { text: 'No', numerical: 3 }]
    }, {
        text: 'How long has it been in years since your stopped your alcohol abuse? If you still abuse alcohol please write 0.',
        required: false,
        type: 'integer',
        answerIdentifier: 'QID23'
    }, {
        text: 'How often do you drink alcoholic drinks?',
        instruction: '(1 drink would equal either 4 oz of wine, 12 ounces beer or 1 oz of liquor)',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID12',
        oneOfchoices: ['Not at all', 'Less than 1 drink/day', '1-2 drinks/day', '3 or more drinks/day']
    }, {
        text: 'Do you have hypertension (high blood pressure)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID13',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Do you have diabetes?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID14',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Please indicate whether you currently have or had experienced drug abuse in the past.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID24',
        choices: [{ text: 'Yes', numerical: 1 }, { text: 'No', numerical: 3 }]
    }, {
        text: 'How long has it been in years since you stopped the drug abuse? If you still abuse drugs please write 0.',
        required: false,
        type: 'integer',
        answerIdentifier: 'QID25'
    }, {
        text: 'Are you currently taking any of the following types of medications?',
        instruction: '(Select all that apply)',
        required: false,
        type: 'choices',
        skip: {
        	count: 2,
        	rule: {
        		logic: 'each'
        	}
        },
        choices: [
            { text: 'Anti-depressant medication', answerIdentifier: 'QID15_1' },
            { text: 'Anti-anxiety medication', answerIdentifier: 'QID15_2' }
		]
    }, {
        text: 'How long has your current anti-depressant prescription been stable (same medication, frequency, dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID26',
        choices: [{ text: 'Years', numerical: 1 }, { text: 'Months', numerical: 2 }]
    }, {
        text: 'How long has your current anti-anxiety prescription been stable (same medication, frequency, dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID27',
        choices: [{ text: 'Years', numerical: 1 }, { text: 'Months', numerical: 3 }]
    }, {
        text: 'Are you currently taking any of the following medications?',
        instruction: '(Select all that apply)',
        required: false,
        type: 'choices',
        skip: {
        	count: 10,
        	rule: {
        		logic: 'each'
        	}
        },
        choices: [
            { text: 'Donepezil (Aricept)', answerIdentifier: 'QID16_1' },
            { text: 'Tacrine (Cognex)', answerIdentifier: 'QID16_2' },
            { text: 'Rivastigmine (Exelon)', answerIdentifier: 'QID16_3' },
            { text: 'Memantine (Namenda)', answerIdentifier: 'QID16_4' },
            { text: 'Galantamine (Razadyne)', answerIdentifier: 'QID16_5' },
            { text: 'Risperidone (Risperdal)', answerIdentifier: 'QID16_6' },
            { text: 'Paliperidone (Invega)', answerIdentifier: 'QID16_7' },
            { text: 'Olanzapine (Zyprexa)', answerIdentifier: 'QID16_8' },
            { text: 'Quetiapine (Seroquel)', answerIdentifier: 'QID16_9' },
            { text: 'Aripiprazole (Abilify)', answerIdentifier: 'QID16_10' }
		]
    }, {
        text: 'How long has your current Donepezil (Aricept) prescription been stable (same frequency and dose)??',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID28',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Tacrine (Cognex) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID29',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Rivastigmine (Exelon) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID30',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Memantine (Namenda) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID31',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Galantamine (Razadyne) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID32',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Risperidone (Risperdal) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID33',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Paliperidone (Invega) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID34',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Olanzapine (Zyprexa) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID35',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Quetiapine (Seroquel) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID36',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Aripiprazole (Abilify) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID37',
        oneOfchoices: ['Years', 'Months']
    }]
};
