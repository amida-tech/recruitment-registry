'use strict';

module.exports = {
    name: 'OSUTBI_Injuries',
    questions: [{
        text: 'What was the cause of the injury?',
        required: false,
        type: 'choice',
        answerIdentifier: 'Cause',
        choices: [
            { text: 'Car Accident', numerical: 1 },
            { text: 'Other vehicle accident', numerical: 2 },
            { text: 'Fall', numerical: 3 },
            { text: 'Sports accident', numerical: 4 },
            { text: 'Playground accident', numerical: 5 },
            { text: 'Gunshot', numerical: 6 },
            { text: 'Fight', numerical: 7 },
            { text: 'Shaken violently', numerical: 8 },
            { text: 'Explosion', numerical: 9 },
            { text: 'Other', numerical: 10 },
            { text: 'Hit by something', numerical: 11 }
        ]
    }, {
        text: 'Please describe:',
        required: false,
        type: 'text',
        answerIdentifier: 'Description'
    }, {
        text: 'Were you knocked out or did you lose consciousness?',
        required: false,
        type: 'choice',
        answerIdentifier: 'LostConsciousness',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'For how long did you lose consciousness?',
        required: false,
        type: 'choice',
        answerIdentifier: 'HowLongOut',
        choices: [
            { text: 'Less than 30 minutes' },
            { text: '30 minutes to 24 hours' },
            { text: 'More than 24 hours' }
        ]
    }, {
        text: 'Were you dazed or did you have a gap in your memory from your injury?',
        required: false,
        type: 'choice',
        answerIdentifier: 'MemoryLoss',
        oneOfchoices: ['Yes', 'No']
    }, {
        text: 'How old were you?',
        required: false,
        type: 'integer',
        answerIdentifier: 'Age'
    }]
};
