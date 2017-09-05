'use strict';

module.exports = {
    name: 'Diet',
    identifier: {
        type: 'bhr-gap',
        value: 'diet',
    },
    questions: [{
        text: 'How many meals do you eat each day?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID161' },
        choiceSetReference: 'count-0-5-plus',
    }, {
        text: 'How many snacks do you eat each day?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID167' },
        choiceSetReference: 'count-0-10-plus',
    }, {
        text: 'How many times a week do you eat breakfast away from home?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID168' },
        choiceSetReference: 'count-0-7',
    }, {
        text: 'How many times a week do you eat lunch away from home?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID170' },
        choiceSetReference: 'count-0-7',
    }, {
        text: 'How many times a week do you eat dinner away from home?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID171' },
        choiceSetReference: 'count-0-7',
    }, {
        text: 'What types of eating places do you frequently visit?',
        instruction: 'Check all that apply',
        required: false,
        type: 'choices',
        choices: [
            { text: 'Fast-food', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID129_1' } },
            { text: 'Restaurant', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID129_2' } },
            { text: 'Diner/cafeteria', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID129_3' } },
            { text: 'Other', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID129_4' } },
        ],
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'not-selected',
        //        selectionTexts: ['Other']
        //    }
        //}
    }, {
        text: 'Please indicate \'Other\' eating place',
        required: false,
        type: 'text',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID129_4_TEXT' },
    }, {
        text: 'On average, how many servings of fruit do you eat each day?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID172' },
        choiceSetReference: 'count-0-5-plus',
    }, {
        text: 'On average, how many glasses of juice do you drink each day?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID173' },
        choiceSetReference: 'count-0-5-plus',
    }, {
        text: 'On average, how many servings of vegetables do you eat each day?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID131' },
        choiceSetReference: 'count-0-8-plus',
    }, {
        text: 'On average, how many times a week do you eat a high-fiber breakfast cereal?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID132' },
        choiceSetReference: 'count-0-10-plus',
    }, {
        text: 'How many times a week do you eat red meat (beef, lamb, veal) or pork?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID133' },
        choiceSetReference: 'count-0-20-plus',
    }, {
        text: 'How many times a week do you eat chicken or turkey?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID165' },
        choiceSetReference: 'count-0-20-plus',
    }, {
        text: 'How many times a week do you eat fish or shellfish?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID166' },
        choiceSetReference: 'count-0-20-plus',
    }, {
        text: 'How many hours of television do you watch every day?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID136' },
        choiceSetReference: 'count-0-12-plus',
    }, {
        text: 'Do you usually snack while watching television?',
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID137' },
        choiceSetReference: 'yes-no-1-2',
    }, {
        text: 'How many times a week do you eat desserts and sweets?',
        required: false,
        type: 'text', // data files has some  data like  04
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID138' },
    }, {
        text: 'What types of beverages do you usually drink?',
        required: false,
        type: 'choices',
        answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139' },
        choices: [
            { text: 'Water', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_1' } },
            { text: 'Juice', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_2' } },
            { text: 'Soda', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_3' } },
            { text: 'Diet soda', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_4' } },
            { text: 'Sports drinks', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_5' } },
            { text: 'Tea', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_6' } },
            { text: 'Coffee', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_7' } },
            { text: 'Whole milk', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_8' } },
            { text: '2% milk', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_9' } },
            { text: '1% milk', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_10' } },
            { text: 'Skim milk', answerIdentifier: { type: 'bhr-gap-diet-column', value: 'QID139_11' } },
        ],
        //skip: {
        //    count: 1,
        //    rule: {
        //        logic: 'each-not-selected'
        //    }
        //}
    }, {
        text: 'How many servings of each do you drink a day?',
        required: false,
        type: 'text',
        multiple: true,
        answerIdentifiers: {
            type: 'bhr-gap-diet-column',
            values: ['QID139_1_TEXT', 'QID139_2_TEXT', 'QID139_3_TEXT', 'QID139_4_TEXT', 'QID139_5_TEXT', 'QID139_6_TEXT', 'QID139_7_TEXT', 'QID139_8_TEXT', 'QID139_9_TEXT', 'QID139_10_TEXT', 'QID139_11_TEXT'],
        },

    }],
};
