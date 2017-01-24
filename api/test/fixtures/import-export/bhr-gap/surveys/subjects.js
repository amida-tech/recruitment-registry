'use strict';

module.exports = {
    name: 'Subjects',
    identifier: {
        type: 'bhr-unit-test',
        value: 'subjects'
    },
    questions: [{
        text: 'Eye Color',
        required: false,
        type: 'choice',
        questionIdentifier: {
            type: 'subjects-column',
            value: 'EyeColor'
        },
        choices: [
            { text: 'Blue' },
            { text: 'Green' },
            { text: 'Brown' },
            { text: 'Hazel' },
            { text: 'Black' }
        ]
    }, {
        text: 'Hair Color',
        required: false,
        type: 'choice',
        questionIdentifier: {
            type: 'subjects-column',
            value: 'HairColor'
        },
        choices: [
            { text: 'Brown' },
            { text: 'Black' },
            { text: 'Blonde' },
            { text: 'White' }
        ]
    }, {
        text: 'Race/Ethnicity',
        required: false,
        type: 'choices',
        questionIdentifier: {
            type: 'subjects-column',
            value: 'RaceEthnicity'
        },
        choices: [
            { text: 'Latino' },
            { text: 'African American' },
            { text: 'Asian' },
            { text: 'Caucasian' },
            { text: 'Native American' },
            { text: 'Pacific Islander' },
            { text: 'Other' },
            { text: 'Declined To State', type: 'bool-sole' }
        ]
    }, {
        text: 'Age',
        required: true,
        type: 'integer',
        questionIdentifier: {
            type: 'subjects-column',
            value: 'Age'
        }
    }]
};
