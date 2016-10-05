'use strict';

exports.Example = {
    survey: {
        name: 'Example',
        questions: [{
            content: {
                text: 'Which sports do you like?',
                type: 'choices',
                choices: [
                    { text: 'Football' },
                    { text: 'Basketball' },
                    { text: 'Soccer' },
                    { text: 'Tennis' }
                ]
            }
        }, {
            content: {
                text: 'What is your hair color?',
                type: 'choice',
                choices: [
                    { text: 'Black' },
                    { text: 'Brown' },
                    { text: 'Blonde' },
                    { text: 'Other' }
                ]
            }
        }, {
            content: {
                text: 'Where were you born?',
                type: 'text'
            }
        }, {
            content: {
                text: 'Are you injured?',
                type: 'bool'
            }
        }, {
            content: {
                text: 'Do you have a cat?',
                type: 'bool'
            }
        }]
    },
    answer: [{
        choices: [{ index: 1 }, { index: 2 }]
    }, {
        choice: 0
    }, {
        textValue: 'Washington, DC'
    }, {
        boolValue: true
    }, {
        boolValue: false
    }],
    answerUpdate: [{
        choices: [{ index: 2 }, { index: 3 }]
    }, {
        choice: 2
    }, {
        textValue: 'Boston, MA'
    }, {
        boolValue: false
    }, {
        boolValue: true
    }]
};

exports.Alzheimer = {
    survey: {
        name: 'Alzheimer',
        questions: [{
            content: {
                text: 'Family history of memory disorders/AD/dementia?',
                type: 'bool'
            }
        }, {
            content: {
                text: 'How did you hear about us?',
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
                    { text: 'Other source', type: 'text' }
                ]
            }
        }, {
            content: {
                text: 'Are you interested in receiving email updates on any of the following?',
                type: 'choices',
                choices: [
                    { text: 'Brain Health' },
                    { text: 'Clinical Trials on Brain Health' }
                ],
                actions: [{
                    type: 'true',
                    text: 'Subscribe'
                }, {
                    type: 'false',
                    text: 'I don\'t want to receive emails'
                }]
            }
        }, {
            content: {
                text: 'Are you interested in participating in clinical trials?',
                type: 'bool'
            }
        }]
    },
    answer: [{
        boolValue: true
    }, {
        choices: [{ index: 0 }, { index: 5 }, { index: 8, textValue: 'Internet' }]
    }, {
        choices: [{ index: 1 }]
    }, {
        boolValue: true
    }],
    answerUpdate: [{
        boolValue: true
    }, {
        choices: [{ index: 2 }, { index: 3 }, { index: 8, textValue: 'Metro Ad' }]
    }, {
        choices: [{ index: 0 }, { index: 1 }]
    }, {
        boolValue: false
    }]
};
