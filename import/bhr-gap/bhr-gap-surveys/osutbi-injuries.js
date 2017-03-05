'use strict';

module.exports = {
    name: 'OSUTBI_Injuries',
    identifier: {
        type: 'bhr-gap',
        value: 'osutbi-injuries',
    },
    questions: [{
        text: 'Did you experience injuries?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-injuries-column', value: 'Ord' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'What was the cause of the injury?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-injuries-column', value: 'Cause' },
        choiceSetReference: 'injury-cause',
    }, {
        text: 'Please describe:',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-osutbi-injuries-column', value: 'Description' },
    }, {
        text: 'Were you knocked out or did you lose consciousness?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-injuries-column', value: 'LostConsciousness' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'For how long did you lose consciousness?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-injuries-column', value: 'HowLongOut' },
        choiceSetReference: 'duration-mh',
    }, {
        text: 'Were you dazed or did you have a gap in your memory from your injury?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-injuries-column', value: 'MemoryLoss' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'How old were you?',
        required: false,
        type: 'float',
        answerIdentifier: { type: 'bhr-gap-osutbi-injuries-column', value: 'Age' },
    }],
};
