'use strict';

exports.Example = {
    survey: {
        name: 'Example',
        questions: [{
            text: 'Which sports do you like?',
            required: false,
            type: 'choices',
            choices: [
                { text: 'Football' },
                { text: 'Basketball' },
                { text: 'Soccer' },
                { text: 'Tennis' },
            ],
        }, {
            text: 'What is your hair color?',
            required: true,
            type: 'choice',
            choices: [
                { text: 'Black' },
                { text: 'Brown' },
                { text: 'Blonde' },
                { text: 'Other' },
            ],
        }, {
            text: 'Where were you born?',
            required: true,
            type: 'text',
        }, {
            text: 'Are you injured?',
            required: false,
            type: 'bool',
        }, {
            text: 'Do you have a cat?',
            required: true,
            type: 'bool',
        }],
    },
    answer: [{
        choices: [{ index: 1 }, { index: 2 }],
    }, {
        choice: 0,
    }, {
        textValue: 'Washington, DC',
    }, {
        boolValue: true,
    }, {
        boolValue: false,
    }],
    answerUpdate: [{
        choices: [{ index: 2 }, { index: 3 }],
    }, {
        choice: 2,
    }, {
        textValue: 'Boston, MA',
    }, {
        boolValue: false,
    }, {
        boolValue: true,
    }],
};

exports.Alzheimer = {
    survey: {
        name: 'Alzheimer',
        questions: [{
            text: 'Ethnicity',
            required: true,
            type: 'choice',
            oneOfChoices: [
                'Caucasian',
                'Hispanic',
                'African',
                'Asian',
            ],
        }, {
            text: 'Gender',
            required: true,
            type: 'choice',
            oneOfChoices: ['male', 'female', 'other'],
        }, {
            text: 'Zip code',
            required: false,
            type: 'text',
        }, {
            text: 'Family history of memory disorders/AD/dementia?',
            required: true,
            type: 'bool',
        }, {
            text: 'How did you hear about us?',
            required: false,
            type: 'choices',
            choices: [
                { text: 'TV' },
                { text: 'Radio' },
                { text: 'Newspaper' },
                { text: 'Facebook/Google Ad/OtherInternet ad' },
                { text: 'Physician/nurse/healthcare professional' },
                { text: 'Caregiver' },
                { text: 'Friend/Family member' },
                { text: 'Community Event' },
                { text: 'Other source', type: 'text' },
            ],
        }, {
            text: 'Are you interested in receiving email updates on any of the following?',
            required: true,
            type: 'choices',
            choices: [
                { text: 'Brain Health' },
                { text: 'Clinical Trials on Brain Health' },
            ],
            actions: [{
                type: 'true',
                text: 'Subscribe',
            }, {
                type: 'false',
                text: 'I don\'t want to receive emails',
            }],
        }, {
            text: 'Are you interested in participating in clinical trials?',
            required: false,
            type: 'bool',
        }],
    },
    answer: [{
        choice: 1,
    }, {
        choice: 1,
    }, {
        textValue: '20850',
    }, {
        boolValue: true,
    }, {
        choices: [{ index: 0 }, { index: 5 }, { index: 8, textValue: 'Internet' }],
    }, {
        choices: [{ index: 1 }],
    }, {
        boolValue: true,
    }],
    answerUpdate: [{
        choice: 0,
    }, {
        choice: 0,
    }, {
        textValue: '20855',
    }, {
        boolValue: true,
    }, {
        choices: [{ index: 2 }, { index: 3 }, { index: 8, textValue: 'Metro Ad' }],
    }, {
        choices: [{ index: 0 }, { index: 1 }],
    }, {
        boolValue: false,
    }],
};
