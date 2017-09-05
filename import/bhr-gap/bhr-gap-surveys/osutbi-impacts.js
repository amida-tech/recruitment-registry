'use strict';

module.exports = {
    name: 'OSUTBI_Impacts',
    identifier: {
        type: 'bhr-gap',
        value: 'osutbi-impacts',
    },
    questions: [{
        text: 'Did you experience repeated impacts?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'Ord' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'What was the cause of the repeated impacts?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'Cause' },
        choiceSetReference: 'impact-cause',
    }, {
        text: 'Please describe:',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'Description' },
    }, {
        text: 'Were you typically or usually knocked out or did you lose consciousness?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'LostConsciousness' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'What was the most severe effect from one of the times you had an impact to the head?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'HowLongOut' },
        choiceSetReference: 'duration-mh',
    }, {
        text: 'Were you typically dazed or did you have a gap in your memory from the injuriy?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'MemoryLoss' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'How old were you when these repeated injuries began?',
        required: false,
        type: 'integer',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'AgeBegan' },
    }, {
        text: 'How old were you when these repeated injuries ended?',
        required: false,
        type: 'integer',
        answerIdentifier: { type: 'bhr-gap-osutbi-impacts-column', value: 'AgeEnded' },
    }],
};
