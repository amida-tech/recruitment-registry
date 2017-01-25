'use strict';

module.exports = {
    name: 'Users',
    identifier: {
        type: 'bhr-unit-test',
        value: 'users'
    },
    questions: [{
        text: 'Eye Color',
        required: false,
        type: 'choice',
        questionIdentifier: {
            type: 'users-column',
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
            type: 'users-column',
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
            type: 'users-column',
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
            type: 'users-column',
            value: 'Age'
        }
    }]
};
