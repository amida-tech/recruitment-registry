'use strict';

module.exports = {
    name: 'Demographics',
    identifier: {
        type: 'bhr-gap',
        value: 'demographics',
    },
    questions: [{
        text: 'What is your weight (lbs)?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID177' },
        choiceSetReference: 'weight-ranges-lbs',
    }, {
        text: 'What is your height (ft\'in")?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID178' },
        choiceSetReference: 'height-ft-inches',
    }, {
        text: 'What is your current marital status?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID180' },
        choiceSetReference: 'marital-status',
    }, {
        text: 'Please indicate your primary residence type',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID189' },
        choiceSetReference: 'primary-residence-type',
    }, {
        text: 'What is/was the field of your primary occupation during most of adult life',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID182' },
        choiceSetReference: 'primary-occupation',
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-equals',
        //        answer: { code: '31' }
        //    }
        //}
    }, {
        text: 'Please indicate *Other occupation',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID183' },
    }, {
        text: 'Please indicate your role in your primary occupational industry',
        required: false,
        type: 'choices',
        choices: [
            { text: 'Upper management', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_1' } },
            { text: 'Middle management', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_2' } },
            { text: 'Junior management', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_3' } },
            { text: 'Administrative staff', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_4' } },
            { text: 'Support staff', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_5' } },
            { text: 'Student', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_6' } },
            { text: 'Trained professional', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_7' } },
            { text: 'Skilled laborer', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_8' } },
            { text: 'Consultant', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_9' } },
            { text: 'Temporary employee', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_10' } },
            { text: 'Researcher', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_11' } },
            { text: 'Self-employed', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_12' } },
            { text: 'Other', answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID184_13' } },
        ],
    }, {
        text: 'Are you retired?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID185' },
        choiceSetReference: 'yes-no-1-2',
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-equals',
        //        answer: { code: '1' }
        //    }
        //}
    }, {
        text: 'Year of retirement',
        required: true,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID186' },
        choiceSetReference: 'retirement-year',
    }, {
        text: 'Are you a veteran of the Armed Forces?',
        required: true,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID192' },
        choiceSetReference: 'yes-no-1-2',
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-equals',
        //        answer: { code: '1' }
        //    }
        //}
    }, {
        text: 'Please indicate which branch of the Armed Forces',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-demographics-column', value: 'QID193' },
        choiceSetReference: 'armed-forces-branch',
    }],
};
