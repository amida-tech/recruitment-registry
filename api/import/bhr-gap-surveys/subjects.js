'use strict';

module.exports = {
    name: 'Sleep',
    questions: [{
        text: 'A unique subject identifier. All data on this subject will be labelled with this code.',
        required: true,
        type: 'text',
        answerIdentifier: 'SubjectCode'
    }, {
        text: 'Gender',
        required: true,
        type: 'choice',
        answerIdentifier: 'Gender',
        choices: [
            { text: 'Male' },
            { text: 'Female' }
        ]
    }, {
        text: 'List of US race/ethnicities separated by a semi-colon (;)',
        required: true,
        type: 'choice',
        answerIdentifier: 'RaceEthnicity',
        choices: [
            { text: 'Latino' },
            { text: 'African American' },
            { text: 'Asian' },
            { text: 'Caucasian' },
            { text: 'Native American' },
            { text: 'Pacific Islander' },
            { text: 'Other' }
        ]
    }, {
        text: 'Years of Education',
        required: true,
        type: 'choice',
        answerIdentifier: 'YearsEducation',
        choices: [
            { text: 'Some College' },
            { text: 'Masters Degree' },
            { text: '2-Year College Degree' },
            { text: 'Grammar School' },
            { text: 'Professional Degree (JD, MD)' },
            { text: 'Doctoral Degree' },
            { text: 'High School / GED' },
            { text: '4-Year College Degree' }
        ]
    }, {
        text: 'Handedness',
        required: true,
        type: 'choice',
        answerIdentifier: 'Handedness',
        choices: [
            { text: 'Ambidextrous' },
            { text: 'Right' },
            { text: 'Left' }
        ]
    }, {
        text: 'AGe Baseline',
        required: true,
        type: 'text',
        answerIdentifier: 'Age_Baseline'
    }]
};
