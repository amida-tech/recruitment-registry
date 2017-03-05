'use strict';

module.exports = {
    name: 'QUOLIBRI',
    identifier: {
        type: 'bhr-gap',
        value: 'quolibri',
    },
    sections: [{
        questions: [{
            text: 'Whether or not questions were asked based on TBI History',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-quolibri-column', value: 'Applicable' },
        }],
    }, {
        name: 'We would like to know how satisfied you are with different aspects of your life since your head injury/injuries. For each question please choose the answer which is closest to how you feel now (including the past week). Overall, how satisfied are you with... ...',
        questions: [{
            type: 'choice-ref',
            choiceSetReference: 'satisfied',
            required: false,
            answerIdentifier: { type: 'bhr-gap-quolibri-column', value: 'Physical' },
            text: 'your physical condition?',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'satisfied',
            required: false,
            answerIdentifier: { type: 'bhr-gap-quolibri-column', value: 'Cognitive' },
            text: 'how your brain is working, in terms of your concentration, memory, thinking?',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'satisfied',
            required: false,
            answerIdentifier: { type: 'bhr-gap-quolibri-column', value: 'Emotional' },
            text: 'your feelings and emotions?',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'satisfied',
            required: false,
            answerIdentifier: { type: 'bhr-gap-quolibri-column', value: 'Ability' },
            text: 'your ability to carry out day to day activities?',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'satisfied',
            required: false,
            answerIdentifier: { type: 'bhr-gap-quolibri-column', value: 'Social' },
            text: 'your personal and social life?',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'satisfied',
            required: false,
            answerIdentifier: { type: 'bhr-gap-quolibri-column', value: 'Future' },
            text: 'your current situation and future prospects?',
        }],
    }],
};
