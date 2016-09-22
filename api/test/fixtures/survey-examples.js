'use strict';

exports.Example = {
    survey: {
        name: 'Example',
        questions: [{
            content: {
                text: 'Which sports do you like?',
                type: 'choices',
                choices: [
                    'Football',
                    'Basketball',
                    'Soccer',
                    'Tennis'
                ]
            }
        }, {
            content: {
                text: 'What is your hair color?',
                type: 'choice',
                choices: [
                    'Black',
                    'Brown',
                    'Blonde',
                    'Other'
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
        choices: [1, 2]
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
        choices: [2, 3]
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
                type: 'choicesplus',
                choices: [
                    'TV',
                    'Radio',
                    'Newspaper',
                    'Facebook/Google Ad/OtherInternet ad',
                    'Physician/nurse/healthcare professional',
                    'Caregiver',
                    'Friend/Family member',
                    'Community Event',
                ],
                additionalText: 'Other source'
            }
        }, {
            content: {
                text: 'Are you interested in receiving more information?',
                type: 'choices',
                choices: [
                    'Brain Health',
                    'Clinical Trials on Brain Health'
                ]
            }
        }, {
            content: {
                text: 'Are you interested in volunterring in clinical research?',
                type: 'bool'
            }
        }]
    },
    answer: [{
        boolValue: true
    }, {
        choices: [0, 5],
        textValue: 'Internet'
    }, {
        choices: [1]
    }, {
        boolValue: true
    }],
    answerUpdate: [{
        boolValue: true
    }, {
        choices: [2, 3],
        textValue: 'Metro Ad'
    }, {
        choices: [0, 1]
    }, {
        boolValue: false
    }]
};
