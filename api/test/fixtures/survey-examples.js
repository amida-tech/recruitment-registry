'use strict';

exports.Example = {
    name: 'Example',
    questions: [{
        content: {
            text: 'Which sports do you like?',
            type: 'multi-choice-multi',
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
            type: 'multi-choice-single',
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
            type: 'yes-no'
        }
    }, {
        content: {
            text: 'Do you have a cat?',
            type: 'yes-no'
        }
    }]
};

exports.ExampleSpec = [{
    isChoice: true,
    answer: [1, 2]
}, {
    isChoice: true,
    answer: 0
}, {
    answer: 'Washington, DC'
}, {
    answer: true
}, {
    answer: false
}];

exports.Alzheimer = {
    name: 'Alzheimer',
    questions: [{
        content: {
            text: 'Family history of memory disorders/AD/dementia?',
            type: 'yes-no'
        }
    }, {
        content: {
            text: 'How did you hear about us?',
            type: 'multi-choice-multi',
            choices: [
                'TV',
                'Radio',
                'Newspaper',
                'Facebook/Google Ad/OtherInternet ad',
                'Physician/nurse/healthcare professional',
                'Caregiver',
                'Friend/Family member',
                'Community Event',
            ]
        }
    }, {
        content: {
            text: 'Are you interested in receiving more information?',
            type: 'multi-choice-multi',
            choices: [
                'Brain Health',
                'Clinical Trials on Brain Health'
            ]
        }
    }, {
        content: {
            text: 'Are you interested in volunterring in clinical research?',
            type: 'yes-no'
        }
    }]
};

exports.AlzheimerSpec = [{
    answer: true
}, {
    isChoice: true,
    answer: [0, 5]
}, {
    isChoice: true,
    answer: [1]
}, {
    answer: true
}];
