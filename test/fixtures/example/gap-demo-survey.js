'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const gapDemoSurvey1 = {
    name: 'Basic Questions',
    questions: [
        {
            text: 'Have you been diagnosed with Alzheimer\'s Disease?',
            required: true,
            type: 'bool',
        },
        {
            text: 'How old are you?',
            required: true,
            type: 'choice',
            choices: [
              { text: 'Younger than 50' },
              { text: '50-55' },
              { text: '55-60' },
              { text: '60-65' },
              { text: '65+' },
            ],
        },
        {
            text: 'Select any other conditions with which you\'ve been diagnosed.',
            required: false,
            type: 'choices',
            choices: [
              { text: 'Arthritis' },
              { text: 'Cancer' },
              { text: 'Heart Disease' },
              { text: 'Diabetes' },
            ],
        },
        {
            text: 'Where were you born?',
            required: true,
            type: 'text',
        }],
};

const gapDemoSurvey2 = {
    name: 'Additional Basic Questions',
    questions: [
        {
            text: 'Do you have memory problems?',
            required: true,
            type: 'bool',
        },
        {
            text: 'What is your gender?',
            required: true,
            type: 'choice',
            choices: [
              { text: 'Female' },
              { text: 'Male' },
              { text: 'Non-binary' },
            ],
        },
        {
            text: 'Select any medications your currently take.',
            required: false,
            type: 'choices',
            choices: [
              { text: 'Donepezil ' },
              { text: 'Galantamine' },
              { text: 'Rivastigmine' },
              { text: 'Memantine' },
            ],
        },
        {
            text: 'What is your weight?',
            required: true,
            type: 'integer',
        }],
};
const gapDemoSurvey3 = {
    name: 'Advanced Survey',
    questions: [
        {
            text: 'Do you have memory problems?',
            required: true,
            type: 'bool',
        },
        {
            text: 'Select any medications your currently take.',
            required: true,
            type: 'choices',
            choices: [
              { text: 'Donepezil ' },
              { text: 'Galantamine' },
              { text: 'Rivastigmine' },
              { text: 'Memantine' },
              { text: 'Other', type: 'text' },
            ],
        }],
};
const gapDemoSurvey4 = {
    name: 'Advanced Sectioned Survey',
    sections: [
        {
            id: 0,
            name: 'section 1',
            questions: [
                {
                    text: 'Do you have memory problems?',
                    required: true,
                    type: 'bool',
                },
                {
                    text: 'What is your gender?',
                    required: true,
                    type: 'choice',
                    choices: [
                { text: 'Female' },
                { text: 'Male' },
                { text: 'Non-binary' },
                    ],
                }],
        },
        {
            id: 1,
            name: 'section 2',
            questions: [
                {
                    text: 'Do you have balance problems?',
                    required: true,
                    type: 'bool',
                },
                {
                    text: 'What is your gender?',
                    required: true,
                    type: 'choice',
                    choices: [
                  { text: 'Female' },
                  { text: 'Male' },
                  { text: 'Other' },
                    ],
                }],
        },
    ],
};

const gapDemoSurveys = [
    gapDemoSurvey1,
    gapDemoSurvey2,
    gapDemoSurvey3,
    gapDemoSurvey4,
];

module.exports = {
    gapDemoSurveys,
};
