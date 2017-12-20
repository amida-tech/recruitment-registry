'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = {
    name: 'Users',
    identifier: {
        type: 'bhr-unit-test',
        value: 'users',
    },
    questions: [{
        text: 'Eye Color',
        required: false,
        isIdentifying: false,
        type: 'choice',
        questionIdentifier: {
            type: 'users-column',
            value: 'EyeColor',
        },
        choices: [
            { text: 'Blue' },
            { text: 'Green' },
            { text: 'Brown' },
            { text: 'Hazel' },
            { text: 'Black' },
        ],
    }, {
        text: 'Hair Color',
        required: false,
        isIdentifying: false,
        type: 'choice',
        questionIdentifier: {
            type: 'users-column',
            value: 'HairColor',
        },
        choices: [
            { text: 'Brown' },
            { text: 'Black' },
            { text: 'Blonde' },
            { text: 'White' },
        ],
    }, {
        text: 'Race/Ethnicity',
        required: false,
        isIdentifying: false,
        type: 'choices',
        questionIdentifier: {
            type: 'users-column',
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
        text: 'Age',
        required: true,
        isIdentifying: false,
        type: 'integer',
        questionIdentifier: {
            type: 'users-column',
            value: 'Age',
        },
    }],
};
