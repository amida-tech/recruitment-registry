'use strict';

module.exports = {
    name: 'NCPT_GoNoGo',
    identifier: {
        type: 'bhr-gap',
        value: 'ncpt-gonogo',
    },
    questions: [{
        text: 'Result',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'Result' },
    }, {
        text: 'Seconds',
        required: false,
        type: 'integer',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'Seconds' },
    }, {
        text: 'Errors',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'Errors' },
    }, {
        text: 'WasInterrupted',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'WasInterrupted' },
    }, {
        text: 'TestingEnvironment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'TestingEnvironment' },
    }, {
        text: 'SelfAssessment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'SelfAssessment' },
    }, {
        text: 'GoodMeasure',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'GoodMeasure' },
    }, {
        text: 'Experience',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'Experience' },
    }, {
        text: 'InstructionsClear',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'InstructionsClear' },
    }, {
        text: 'ExplanationHelpful',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-gonogo-column', value: 'ExplanationHelpful' },
    }],
};
