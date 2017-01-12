'use strict';

module.exports = {
    name: 'OSUTBI_Impacts',
    questions: [{
        text: 'What was the cause of the repeated impacts?',
        required: false,
        type: 'choice',
        answerIdentifier: 'Cause',
        choices: [
            { text: 'Military duty', numerical: 7 },
            { text: 'Contact sports', numerical: 8 },
            { text: 'Abuse', numerical: 9 },
            { text: 'Other', numerical: 10 }
        ]
    }, {
        text: 'Please describe:',
        required: false,
        type: 'text',
        answerIdentifier: 'Description'
    }, {
        text: 'Were you typically or usually knocked out or did you lose consciousness?',
        required: false,
        type: 'choice',
        answerIdentifier: 'LostConsciousness',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'What was the most severe effect from one of the times you had an impact to the head?',
        required: false,
        type: 'choice',
        answerIdentifier: 'HowLongOut',
        choices: [
            { text: 'Less than 30 minutes' },
            { text: '30 minutes to 24 hours' },
            { text: 'More than 24 hours' }
        ]
    }, {
        text: 'Were you typically dazed or did you have a gap in your memory from the injuriy?',
        required: false,
        type: 'choice',
        answerIdentifier: 'MemoryLoss',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'How old were you when these repeated injuries began?',
        required: false,
        type: 'integer',
        answerIdentifier: 'AgeBegan'
    }, {
        text: 'How old were you when these repeated injuries ended?',
        required: false,
        type: 'integer',
        answerIdentifier: 'AgeEnded'
    }]
};
