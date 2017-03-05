'use strict';

module.exports = {
    name: 'MemTrax',
    identifier: {
        type: 'bhr-gap',
        value: 'memtrax',
    },
    questions: [{
        text: 'ResultDate',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'ResultDate' },
    }, {
        text: 'Result',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'Result' },
    }, {
        text: 'OrderSet',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'OrderSet' },
    }, {
        text: 'TotalImages',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'TotalImages' },
    }, {
        text: 'UniqueImages',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'UniqueImages' },
    }, {
        text: 'RepeatImages',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'RepeatImages' },
    }, {
        text: 'CorrectN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'CorrectN' },
    }, {
        text: 'CorrectPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'CorrectPCT' },
    }, {
        text: 'IncorrectN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'IncorrectN' },
    }, {
        text: 'IncorrectPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'IncorrectPCT' },
    }, {
        text: 'CorrectRejectionsN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'CorrectRejectionsN' },
    }, {
        text: 'CorrectRejectionsPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'CorrectRejectionsPCT' },
    }, {
        text: 'IncorrectRejectionsN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'IncorrectRejectionsN' },
    }, {
        text: 'IncorrectRejectionsPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'IncorrectRejectionsPCT' },
    }, {
        text: 'TotalRejectionsN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'TotalRejectionsN' },
    }, {
        text: 'TotalRejectionsPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'TotalRejectionsPCT' },
    }, {
        text: 'CorrectResponsesN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'CorrectResponsesN' },
    }, {
        text: 'CorrectResponsesPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'CorrectResponsesPCT' },
    }, {
        text: 'CorrectResponsesRT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'CorrectResponsesRT' },
    }, {
        text: 'IncorrectResponsesN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'IncorrectResponsesN' },
    }, {
        text: 'IncorrectResponsesPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'IncorrectResponsesPCT' },
    }, {
        text: 'IncorrectResponsesRT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'IncorrectResponsesRT' },
    }, {
        text: 'TotalResponsesN',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'TotalResponsesN' },
    }, {
        text: 'TotalResponsesPCT',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-memtrax-column', value: 'TotalResponsesPCT' },
    }],
};
