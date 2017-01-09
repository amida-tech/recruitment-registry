'use strict';

const _ = require('lodash');

const countChoices = function (count, plus) {
    const result = _.range(0, count).map(index => ({ text: `${index}` }));
    if (plus) {
        result.push({ text: `${count}+` });
    }
    return result;
};

module.exports = {
    name: 'Diet',
    questions: [{
        text: 'How many meals do you eat each day?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID161',
        choices: countChoices(5, true)
    }, {
        text: 'How many snacks do you eat each day?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID167',
        choices: countChoices(10, true)
    }, {
        text: 'How many times a week do you eat breakfast away from home?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID168',
        choices: countChoices(8)
    }, {
        text: 'How many times a week do you eat lunch away from home?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID170',
        choices: countChoices(8)
    }, {
        text: 'How many times a week do you eat dinner away from home?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID171',
        choices: countChoices(8)
    }, {
        text: 'What types of eating places do you frequently visit?',
        instruction: 'Check all that apply',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID129',
        choices: [
            { text: 'Fast-food' },
            { text: 'Restaurant' },
            { text: 'Diner/cafeteria' },
            { text: 'Other' }
        ]
    }, {
        text: 'On average, how many servings of fruit do you eat each day?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID172',
        choices: countChoices(5, true)
    }, {
        text: 'On average, how many glasses of juice do you drink each day?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID173',
        choices: countChoices(5, true)
    }, {
        text: 'On average, how many servings of vegetables do you eat each day?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID131',
        choices: countChoices(8, true)
    }, {
        text: 'On average, how many times a week do you eat a high-fiber breakfast cereal?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID132',
        choices: countChoices(10, true)
    }, {
        text: 'How many times a week do you eat red meat (beef, lamb, veal) or pork?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID133',
        choices: countChoices(20, true)
    }, {
        text: 'How many times a week do you eat chicken or turkey?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID165',
        choices: countChoices(20, true)
    }, {
        text: 'How many times a week do you eat fish or shellfish?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID166',
        choices: countChoices(20, true)
    }, {
        text: 'How many hours of television do you watch every day?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID136',
        choices: countChoices(12, true)
    }, {
        text: 'Do you usually snack while watching television?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID137',
        choices: [
            { text: 'Yes' },
            { text: 'No' }
        ]
    }, {
        text: 'How many times a week do you eat desserts and sweets?',
        required: false,
        type: 'intege',
        answerIdentifier: 'QID138'
    }, {
        text: 'What types of beverages do you usually drink?  How many servings of each do you drink a day?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID139',
        choices: [
            { text: 'Water' },
            { text: 'Juice' },
            { text: 'Soda' },
            { text: 'Diet soda' },
            { text: 'Sports drinks' },
            { text: 'Tea' },
            { text: 'Coffee' },
            { text: 'Whole milk' },
            { text: '2% milk' },
            { text: '1% milk' },
            { text: 'Skim milk' }
        ]
    }]
};
