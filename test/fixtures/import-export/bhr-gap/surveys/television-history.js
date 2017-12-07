'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = {
    name: 'Television History',
    identifier: {
        type: 'bhr-unit-test',
        value: 'television-history',
    },
    sections: [{
        questions: [{
            text: 'Do you own any television of the following brands?',
            required: false,
            isIdentifying: false,
            type: 'choices',
            choices: [
                { text: 'Samsung', answerIdentifier: { type: 'television-column', value: 'QID1_1' } },
                { text: 'LG', answerIdentifier: { type: 'television-column', value: 'QID1_2' } },
                { text: 'Sharp', answerIdentifier: { type: 'television-column', value: 'QID1_3' } },
            ],
        }, {
            text: 'Do you own any other television brands?',
            required: true,
            isIdentifying: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'television-column', value: 'QID2' },
            choiceSetReference: 'yes-no-1-2',
            sections: [{
                enableWhen: [{
                    questionIndex: 1,
                    logic: 'equals',
                    answer: { code: '1' },
                }],
                questions: [{
                    text: 'Please list the other television brands you currently own.',
                    instruction: 'Television',
                    required: false,
                    isIdentifying: false,
                    type: 'text',
                    multiple: true,
                    maxCount: 3,
                    answerIdentifiers: {
                        type: 'television-column',
                        values: ['QID3_1_TEXT', 'QID3_2_TEXT', 'QID3_3_TEXT'],
                    },
                }, {
                    text: 'What is the model number for the television?',
                    required: false,
                    isIdentifying: false,
                    type: 'text',
                    multiple: true,
                    maxCount: 3,
                    answerIdentifiers: {
                        type: 'television-column',
                        values: ['QID4_1_TEXT', 'QID4_2_TEXT', 'QID4_3_TEXT'],
                    },
                    enableWhen: [{
                        questionIndex: 2,
                        logic: 'exists',
                    }],
                }],
            }],
        }, {
            text: 'Are you currently happy with your televisions?',
            required: false,
            isIdentifying: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            answerIdentifier: { type: 'television-column', value: 'QID5' },
        }, {
            text: 'Please list all brands that you are not happy with?',
            required: true,
            isIdentifying: false,
            type: 'text',
            multiple: true,
            maxCount: 3,
            answerIdentifiers: {
                type: 'television-column',
                values: ['QID6_1_TEXT', 'QID6_2_TEXT', 'QID6_3_TEXT'],
            },
            enableWhen: [{
                questionIndex: 4,
                logic: 'equals',
                answer: { code: '1' },
            }],
        }],
    }, {
        name: 'How many hours do you spend watching the following sports:',
        questions: [{
            text: 'Basketball',
            type: 'choice-ref',
            required: false,
            isIdentifying: false,
            choiceSetReference: 'count-0-3-plus',
            answerIdentifier: { type: 'television-column', value: 'QID7_1' },
        }, {
            text: 'Footbal',
            type: 'choice-ref',
            required: false,
            isIdentifying: false,
            choiceSetReference: 'count-0-3-plus',
            answerIdentifier: { type: 'television-column', value: 'QID7_2' },
        }, {
            text: 'Baseball',
            type: 'choice-ref',
            required: false,
            isIdentifying: false,
            choiceSetReference: 'count-0-3-plus',
            answerIdentifier: { type: 'television-column', value: 'QID7_3' },
        }, {
            text: 'Ice Hockey',
            type: 'choice-ref',
            required: false,
            isIdentifying: false,
            choiceSetReference: 'count-0-3-plus',
            answerIdentifier: { type: 'television-column', value: 'QID7_4' },
        }],
    }],
};
