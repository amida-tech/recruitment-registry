'use strict';

module.exports = [{
    name: 'name',
    questions: [{ id: 1, required: false }, { id: 2, required: true }, { id: 3, required: false }]
}, {
    name: 'name',
    questions: [{
        text: 'What is it?',
        required: true,
        type: 'text'
    }, {
        text: 'What is it?',
        required: false,
        type: 'text'
    }, {
        text: 'What is date?',
        required: false,
        type: 'date'
    }]
}, {
    name: 'name',
    questions: [{
        id: 1,
        required: false
    }, {
        text: 'What is it?',
        required: true,
        type: 'text'
    }, {
        id: 2,
        required: false
    }]
}, {
    name: 'name_0',
    description: 'description_0',
    questions: [{
        'id': 1,
        'required': false
    }, {
        'id': 2,
        'required': true
    }, {
        'id': 3,
        'required': false
    }, {
        'id': 4,
        'required': false,
        'skip': {
            'count': 3,
            'rule': {
                'logic': 'equals',
                'answer': {
                    'choice': 6
                }
            }
        }
    }, {
        'id': 5,
        'required': false
    }, {
        'id': 6,
        'required': true
    }, {
        'id': 7,
        'required': false
    }, {
        'id': 8,
        'required': true
    }]
}, {
    name: 'name_13',
    meta: {
        'displayAsWizard': true,
        'saveProgress': false
    },
    questions: [{
        id: 105,
        required: false
    }, {
        id: 106,
        required: true
    }, {
        id: 107,
        required: false
    }, {
        id: 108,
        required: false,
        section: {
            questions: [{
                id: 109,
                required: true
            }, {
                id: 110,
                required: false
            }, {
                id: 111,
                required: true
            }],
            enableWhen: {
                rule: {
                    logic: 'not-equals',
                    answer: {
                        choice: 184
                    }
                },
                questionId: 108
            }
        }
    }, {
        id: 112,
        required: true
    }]
}];
