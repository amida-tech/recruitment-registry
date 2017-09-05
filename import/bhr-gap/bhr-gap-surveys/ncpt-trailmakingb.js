'use strict';

module.exports = {
    name: 'NCPT_TrailMakingB',
    identifier: {
        type: 'bhr-gap',
        value: 'ncpt-trailmakingb',
    },
    questions: [{
        text: 'Result',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'Result' },
    }, {
        text: 'Seconds',
        required: false,
        type: 'integer',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'Seconds' },
    }, {
        text: 'Errors',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'Errors' },
    }, {
        text: 'WasInterrupted',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'WasInterrupted' },
    }, {
        text: 'TestingEnvironment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'TestingEnvironment' },
    }, {
        text: 'SelfAssessment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'SelfAssessment' },
    }, {
        text: 'GoodMeasure',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'GoodMeasure' },
    }, {
        text: 'Experience',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'Experience' },
    }, {
        text: 'InstructionsClear',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'InstructionsClear' },
    }, {
        text: 'ExplanationHelpful',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-trailmakingb-column', value: 'ExplanationHelpful' },
    }],
};
