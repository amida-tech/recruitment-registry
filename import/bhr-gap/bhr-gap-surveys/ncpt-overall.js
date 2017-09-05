'use strict';

module.exports = {
    name: 'NCPT_Overall',
    identifier: {
        type: 'bhr-gap',
        value: 'ncpt-overall',
    },
    questions: [{
        text: 'Result',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'Result' },
    }, {
        text: 'StandardScore',
        required: false,
        type: 'integer',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'StandardScore' },
    }, {
        text: 'Percentile',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'Percentile' },
    }, {
        text: 'WasInterrupted',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'WasInterrupted' },
    }, {
        text: 'TestingEnvironment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'TestingEnvironment' },
    }, {
        text: 'SelfAssessment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'SelfAssessment' },
    }, {
        text: 'GoodMeasure',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'GoodMeasure' },
    }, {
        text: 'Experience',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'Experience' },
    }, {
        text: 'InstructionsClear',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'InstructionsClear' },
    }, {
        text: 'ExplanationHelpful',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-overall-column', value: 'ExplanationHelpful' },
    }],
};
