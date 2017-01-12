'use strict';

module.exports = {
    name: 'Initial_m06',
    questions: [{
        text: 'How often do you use a computer?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID44',
        oneOfchoices: ['Daily', 'Weekly', 'Monthly', 'Almost never']
    }, {
        text: 'How confident are you with computers?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID45',
        oneOfchoices: ['Not confident at all', 'I usually need help', 'It depends on the task', 'Confident']
    }, {
        text: 'Are you concerned that you have a memory problem?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID1',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Compared to six months ago, how would you rate your memory in general?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID2',
        oneOfchoices: ['Much Better', 'Better', 'About the same', 'Worse', 'Much Worse']
    }, {
        text: 'Do you have trouble remembering if you have already told someone something?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID3',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Compared to one year ago, how would you rate your health in general now?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID4',
        oneOfchoices: ['Much Better', 'Better', 'About the same', 'Worse', 'Much Worse']
    }, {
        text: 'In general, would you say your health is:',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID24',
        oneOfchoices: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
    }, {
        text: 'Are you in good spirits most of the time?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID7',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Compared to six months ago, how would you rate your mood in general?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID8',
        oneOfchoices: ['Much Better', 'Better', 'About the same', 'Worse', 'Much Worse']
    }, {
        text: 'Have you dropped many of your activities and interests?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID25',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Compared to six months ago, are you pursuing fewer or more activities and interests?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID10',
        oneOfchoices: ['Much fewer', 'Fewer', 'About the same', 'More', 'Much more']
    }, {
        text: 'During the past month, did you experience any sleep problems?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID11',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'During the past month, did you take any sleep medications?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID12',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Compared to six months ago, how would you rate your sleep in general?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID13',
        oneOfchoices: ['Much Better', 'Better', 'About the same', 'Worse', 'Much Worse']
    }, {
        text: 'How often do you drink alcoholic drinks?',
        instruction: '(1 drink would equal either 4 oz of wine, 12 ounces beer or 1 oz of liquor)',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID14',
        oneOfchoices: ['Not at all', 'Less than 1 drink/day', '1-2 drinks/day', '3 or more drinks/day']
    }, {
        text: 'Compared to six months ago, has your consumption of alcohol changed?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID15',
        oneOfchoices: ['Increased', 'Remained about the same', 'Decreased']
    }, {
        text: 'Please indicate whether you currently have or had experienced alcohol abuse in the past.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID27',
        choices: [{ text: 'Yes', numerical: 1 }, { text: 'No', numerical: 3 }]
    }, {
        text: 'How long has it been in years since your stopped your alcohol abuse? If you still abuse alcohol please write 0.',
        required: false,
        type: 'integer',
        answerIdentifier: 'QID28'
    }, {
        text: 'Please indicate whether you currently have or had experienced drug abuse in the past.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID29',
        choices: [{ text: 'Yes', numerical: 1 }, { text: 'No', numerical: 3 }]
    }, {
        text: 'How long has it been in years since you stopped the drug abuse? If you still abuse drugs please write 0.',
        required: false,
        type: 'integer',
        answerIdentifier: 'QID30'
    }, {
        text: 'Do you have hypertension (high blood pressure)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID16',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'Do you have diabetes?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID17',
        oneOfchoices: ['Yes', 'No']
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
            { text: 'Anti-depressant medication', answerIdentifier: 'QID18_1' },
            { text: 'Anti-anxiety medication', answerIdentifier: 'QID18_2' }
        ]
    }, {
        text: 'How long has your current anti-depressant prescription been stable (same medication, frequency, dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID31',
        choices: [{ text: 'Years', numerical: 1 }, { text: 'Months', numerical: 2 }]
    }, {
        text: 'How long has your current anti-anxiety prescription been stable (same medication, frequency, dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID32',
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
            { text: 'Donepezil (Aricept)', answerIdentifier: 'QID19_1' },
            { text: 'Tacrine (Cognex)', answerIdentifier: 'QID19_2' },
            { text: 'Rivastigmine (Exelon)', answerIdentifier: 'QID19_3' },
            { text: 'Memantine (Namenda)', answerIdentifier: 'QID19_4' },
            { text: 'Galantamine (Razadyne)', answerIdentifier: 'QID19_5' },
            { text: 'Risperidone (Risperdal)', answerIdentifier: 'QID19_6' },
            { text: 'Paliperidone (Invega)', answerIdentifier: 'QID19_7' },
            { text: 'Olanzapine (Zyprexa)', answerIdentifier: 'QID19_8' },
            { text: 'Quetiapine (Seroquel)', answerIdentifier: 'QID19_9' },
            { text: 'Aripiprazole (Abilify)', answerIdentifier: 'QID19_10' }
        ]
    }, {
        text: 'How long has your current Donepezil (Aricept) prescription been stable (same frequency and dose)??',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID34',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Tacrine (Cognex) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID35',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Rivastigmine (Exelon) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID36',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Memantine (Namenda) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID37',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Galantamine (Razadyne) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID38',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Risperidone (Risperdal) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID39',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Paliperidone (Invega) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID40',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Olanzapine (Zyprexa) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID41',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Quetiapine (Seroquel) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID42',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How long has your current Aripiprazole (Abilify) prescription been stable (same frequency and dose)?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID43',
        oneOfchoices: ['Years', 'Months']
    }, {
        text: 'How often would you be willing to come back to the Brain Health Registry for return visits?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID20',
        oneOfchoices: ['Every month', 'Every 3 months', 'Every 4 months', 'Every 6 months', 'Once a year']
    }]
};
