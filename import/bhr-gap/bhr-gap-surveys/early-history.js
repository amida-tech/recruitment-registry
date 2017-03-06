'use strict';

const yesNoQuestion = function (identifier, text) {
    return {
        text,
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-early-history-column', value: identifier },
        choiceSetReference: 'yes-no-1-2',
    };
};

module.exports = {
    name: 'Early History',
    identifier: {
        type: 'bhr-gap',
        value: 'early-history',
    },
    questions: [
        yesNoQuestion('QID72', 'Dyslexia or Reading Disability (e.g. difficulties with reading, learning to read?'),
        yesNoQuestion('QID73', 'Were you diagnosed with a learning disorder (reading, written expression, math)?'),
        yesNoQuestion('QID74', 'Were you diagnosed with motor development delay (e.g. late walking or difficulties with fine movements/learning to use tools)?'),
        yesNoQuestion('QID75', 'Were you diagnosed with developmental language delay and/or stuttering (e.g. late talking, stuttering)?'),
        yesNoQuestion('QID76', 'Were you diagnosed with attention or organizational difficulties (e.g. distracted at school, forgetful in daily activities, difficulty waiting for your turn to speak or interrupting person when talking)?'),
        yesNoQuestion('QID77', 'Were you diagnosed with Attention Deficit Disorder?'),
        yesNoQuestion('QID78', 'Did you have a significant trauma in childhood?'),
        yesNoQuestion('QID79', 'Did you fail or repeat a grade?'),
    ],
};
