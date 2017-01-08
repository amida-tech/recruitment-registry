'use strict';

const satisfiedQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        oneOfChoices: ['Not at All', 'Slightly', 'Moderately', 'Quite', 'Very']
    };
};

const commonText = 'We would like to know how satisfied you are with different aspects of your life since your head injury/injuries. For each question please choose the answer which is closest to how you feel now (including the past week). Overall, how satisfied are you with... ...';

module.exports = {
    name: 'QUOLIBRI',
    questions: [{
        text: 'Whether or not questions were asked based on TBI History',
        required: false,
        type: 'boolean',
        answerIdentifier: 'Applicable'
    },
        satisfiedQuestion('Physical', commonText + 'your physical condition?'),
        satisfiedQuestion('Cognitive', commonText + 'how your brain is working, in terms of your concentration, memory, thinking?'),
        satisfiedQuestion('Emotional', commonText + 'your feelings and emotions?'),
        satisfiedQuestion('Ability', commonText + 'your ability to carry out day to day activities?'),
        satisfiedQuestion('Social', commonText + 'your personal and social life?'),
        satisfiedQuestion('Future', commonText + 'your current situation and future prospects?')
    ]
};
