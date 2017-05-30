'use strict';

module.exports = {
    name: 'NCPT_ReverseMemorySpan',
    identifier: {
        type: 'bhr-gap',
        value: 'ncpt-reversememoryspan',
    },
    questions: [{
        text: 'Result',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'Result' },
    }, {
        text: 'Correct',
        required: false,
        type: 'integer',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'Correct' },
    }, {
        text: 'WasInterrupted',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'WasInterrupted' },
    }, {
        text: 'TestingEnvironment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'TestingEnvironment' },
    }, {
        text: 'SelfAssessment',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'SelfAssessment' },
    }, {
        text: 'GoodMeasure',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'GoodMeasure' },
    }, {
        text: 'Experience',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'Experience' },
    }, {
        text: 'InstructionsClear',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'InstructionsClear' },
    }, {
        text: 'ExplanationHelpful',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-ncpt-reversememoryspan-column', value: 'ExplanationHelpful' },
    }],
};
