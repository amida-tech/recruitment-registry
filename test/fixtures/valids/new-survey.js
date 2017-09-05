'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const conditionalExamples = require('../../util/generator/conditional-survey-generator/surveys');

module.exports = [
    conditionalExamples.travelSurvey,
    {
        name: 'name',
        questions: [{ id: 1, required: false }, { id: 2, required: true }, { id: 3, required: false }],
    }, {
        name: 'name',
        questions: [{
            text: 'What is it?',
            required: true,
            type: 'text',
        }, {
            text: 'What is it?',
            required: false,
            type: 'text',
        }, {
            text: 'What is date?',
            required: false,
            type: 'date',
        }],
    }, {
        name: 'name',
        questions: [{
            id: 1,
            required: false,
        }, {
            text: 'What is it?',
            required: true,
            type: 'text',
        }, {
            id: 2,
            required: false,
        }],
    }, {
        name: 'name_13',
        meta: {
            displayAsWizard: true,
            saveProgress: false,
        },
        questions: [{
            id: 105,
            required: false,
        }, {
            id: 106,
            required: true,
        }, {
            id: 107,
            required: false,
        }, {
            id: 108,
            required: false,
            sections: [{
                questions: [{
                    id: 109,
                    required: true,
                }, {
                    id: 110,
                    required: false,
                }, {
                    id: 111,
                    required: true,
                }],
                enableWhen: [{
                    logic: 'not-equals',
                    answer: {
                        choice: 184,
                    },
                    questionId: 108,
                }],
            }],
        }, {
            id: 112,
            required: true,
        }],
    },
];
