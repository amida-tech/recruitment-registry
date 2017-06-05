'use strict';

module.exports = {
    name: 'NCPT_MemorySpan',
    identifier: {
        type: 'bhr-gap',
        value: 'ncpt-memoryspan',
    },
    questions: [{
        text: 'Result',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'Result' },
    }, {
        text: 'Correct',
        required: false,
        type: 'integer',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'Correct' },
    }, {
        text: 'WasInterrupted',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'WasInterrupted' },
    }, {
        text: 'TestingEnvironment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'TestingEnvironment' },
    }, {
        text: 'SelfAssessment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'SelfAssessment' },
    }, {
        text: 'GoodMeasure',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'GoodMeasure' },
    }, {
        text: 'Experience',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'Experience' },
    }, {
        text: 'InstructionsClear',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'InstructionsClear' },
    }, {
        text: 'ExplanationHelpful',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-memoryspan-column', value: 'ExplanationHelpful' },
    }],
};
