'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = {
    name: 'Sports',
    identifier: {
        type: 'bhr-unit-test',
        value: 'sports',
    },
    questions: [{
        text: 'How many hours a week do you participate in a team sports?',
        required: true,
        isIdentifying: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'sports-column', value: 'QID1' },
        choiceSetReference: 'count-0-8-plus',
    }, {
        text: 'What types of sports do you frequently watch?',
        instruction: 'Check all that apply',
        required: false,
        isIdentifying: false,
        type: 'choices',
        choices: [
            { text: 'Football', answerIdentifier: { type: 'sports-column', value: 'QID2_1' } },
            { text: 'Basketball', answerIdentifier: { type: 'sports-column', value: 'QID2_2' } },
            { text: 'Hockey', answerIdentifier: { type: 'sports-column', value: 'QID2_3' } },
            { text: 'Baseball', answerIdentifier: { type: 'sports-column', value: 'QID2_4' } },
            { text: 'Other', answerIdentifier: { type: 'sports-column', value: 'QID2_5' } },
        ],
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-selected',
        //        selectionTexts: ['Other']
        //    }
        //}
    }, {
        text: 'Please indicate \'Other\' sport.',
        required: false,
        isIdentifying: false,
        type: 'text',
        answerIdentifier: { type: 'sports-column', value: 'QID2_TEXT' },
    }, {
        text: 'On average how many hours do you watch sports or sport related programming on TV a week?',
        required: false,
        isIdentifying: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'sports-column', value: 'QID3' },
        choiceSetReference: 'count-0-8-plus',
    }, {
        text: 'What types of beverages do you usually drink while watching sports?',
        required: false,
        isIdentifying: false,
        type: 'choices',
        answerIdentifier: { type: 'sports-column', value: 'QID4' },
        choices: [
            { text: 'Water', answerIdentifier: { type: 'sports-column', value: 'QID4_1' } },
            { text: 'Juice', answerIdentifier: { type: 'sports-column', value: 'QID4_2' } },
            { text: 'Soda', answerIdentifier: { type: 'sports-column', value: 'QID4_3' } },
            { text: 'Diet soda', answerIdentifier: { type: 'sports-column', value: 'QID4_4' } },
        ],
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'each-not-selected'
        //    }
        //}
    }, {
        text: 'How many servings of each do you drink a a typical watch?',
        required: false,
        isIdentifying: false,
        type: 'text',
        multiple: true,
        answerIdentifiers: {
            type: 'sports-column',
            values: ['QID5_1_TEXT', 'QID5_2_TEXT', 'QID5_3_TEXT', 'QID5_4_TEXT'],
        },
    }],
};
