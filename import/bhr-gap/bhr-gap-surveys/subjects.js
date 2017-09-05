'use strict';

module.exports = {
    name: 'Subjects',
    identifier: {
        type: 'bhr-gap',
        value: 'subjects',
    },
    questions: [{
        text: 'Gender',
        required: false,
        type: 'choice',
        questionIdentifier: {
            type: 'bhr-gap-subjects-column',
            value: 'Gender',
        },
        choices: [
            { text: 'Male' },
            { text: 'Female' },
        ],
    }, {
        text: 'List of US race/ethnicities separated by a semi-colon (;)',
        required: false,
        type: 'choices',
        questionIdentifier: {
            type: 'bhr-gap-subjects-column',
            value: 'RaceEthnicity',
        },
        choices: [
            { text: 'Latino' },
            { text: 'African American' },
            { text: 'Asian' },
            { text: 'Caucasian' },
            { text: 'Native American' },
            { text: 'Pacific Islander' },
            { text: 'Other' },
            { text: 'Declined To State' },
        ],
    }, {
        text: 'Years of Education',
        required: false,
        type: 'choice',
        questionIdentifier: {
            type: 'bhr-gap-subjects-column',
            value: 'YearsEducation',
        },
        choices: [
            { text: 'Some College' },
            { text: 'Masters Degree' },
            { text: '2-Year College Degree' },
            { text: 'Grammar School' },
            { text: 'Professional Degree (JD, MD)' },
            { text: 'Doctoral Degree' },
            { text: 'High School / GED' },
            { text: '4-Year College Degree' },
        ],
    }, {
        text: 'Handedness',
        required: false,
        type: 'choice',
        questionIdentifier: {
            type: 'bhr-gap-subjects-column',
            value: 'Handedness',
        },
        choices: [
            { text: 'Ambidextrous' },
            { text: 'Right' },
            { text: 'Left' },
        ],
    }, {
        text: 'Age Baseline',
        required: true,
        type: 'integer',
        questionIdentifier: {
            type: 'bhr-gap-subjects-column',
            value: 'Age_Baseline',
        },
    }],
};
