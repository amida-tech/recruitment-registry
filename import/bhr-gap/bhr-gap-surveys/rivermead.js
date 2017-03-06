'use strict';

module.exports = {
    name: 'Rivermead',
    identifier: {
        type: 'bhr-gap',
        value: 'rivermead',
    },
    sections: [{
        questions: [{
            text: 'Whether or not questions were asked based on TBI History',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Applicable' },
        }],
    }, {
        name: 'After a head injury or accident some people experience symptoms that can cause worry or nuisance. We would like to know if you now suffer any of the symptoms given below. Because many of these symptoms occur normally, we would like you to compare yourself now with before your head injury/injuries. For each symptom listed below please select the choice that most closely represents your answer. Compared with before the accident, do you now (i.e., over the past week) suffer from:',
        questions: [{
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Headaches' },
            text: 'Headaches',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Dizziness' },
            text: 'Feelings of dizziness',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Nausea' },
            text: 'Nausea and/or vomiting',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'NoiseSensitivity' },
            text: 'Noise Sensitivity (easily upset by loud noise)',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'SleepDisturbance' },
            text: 'Sleep disturbance',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Fatigue' },
            text: 'Fatigue, tiring more easily',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Irritibility' },
            text: 'Being irritable, easily angered',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Depression' },
            text: 'Feeling depressed or tearful',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Frustration' },
            text: 'Feeling frustrated or impatient',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Forgetfulness' },
            text: 'Forgetfulness, poor memory',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'PoorConcentration' },
            text: 'Poor Concentration',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'TakingLonger' },
            text: 'Taking longer to think',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'BlurredVision' },
            text: 'Blurred vision',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'LightSensitivity' },
            text: 'Light sensitivity (easily upset by bright light)',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'DoubleVision' },
            text: 'Double vision',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Restlessness' },
            text: 'Restlessness',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Other1' },
            text: 'Any other difficulties?',
        }, {
            type: 'choice-ref',
            choiceSetReference: 'is-problem-2',
            required: false,
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Other2' },
            text: 'Any other difficulties?',
        }, {
            text: 'Please describe other difficulty 1.',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Other1Description' },
        }, {
            text: 'Please describe other difficulty 1.',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-rivermead-column', value: 'Other2Description' },
        }],
    }],
};
