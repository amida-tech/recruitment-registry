'use strict';

const frequencyQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Not during the past month', numerical: 0 },
            { text: 'Less than once a week', numerical: 1 },
            { text: 'Once or twice a week', numerical: 2 },
            { text: 'Three or more times a week', numerical: 3 }
        ]
    };
};

const goodQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Very good', numerical: 0 },
            { text: 'Fairly good', numerical: 1 },
            { text: 'Fairly bad', numerical: 2 },
            { text: 'Very bad', numerical: 3 }
        ]
    };
};

const commonText = 'During the past month, how often have you had trouble sleeping because you...';
const commonText2 = 'If you have a roommate or bed partner, ask him/her how often in the past month you have had... ';

module.exports = {
    name: 'Sleep',
    questions: [{
        text: 'During the past month, when have you usually gone to bed at night?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID141',
        choices: [
			{ text: 'Before 6:00 PM' },
			{ text: '6:00 PM' },
			{ text: '6:30 PM' },
			{ text: '7:00 PM' },
			{ text: '7:30 PM' },
			{ text: '8:00 PM' },
			{ text: '8:30 PM' },
			{ text: '9:00 PM' },
			{ text: '9:30 PM' },
			{ text: '10:00 PM' },
			{ text: '10:30 PM' },
			{ text: '11:00 PM' },
			{ text: '11:30 PM' },
			{ text: '12:00 AM' },
			{ text: '12:30 AM' },
			{ text: '1:00 AM' },
			{ text: 'After 1:00 AM' }
        ]
    }, {
        text: 'During the past month, how long (in minutes) has it usually taken you to fall asleep each night?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID142',
        choices: [
            { text: '< 5 minutes' },
            { text: '5 minutes' },
            { text: '10 minutes' },
            { text: '15 minutes' },
            { text: '20 minutes' },
            { text: '30 minutes' },
            { text: '45 minutes' },
            { text: '60 minutes' },
            { text: '> 60 minutes' }
        ]
    }, {
        text: 'During the past month, when have you usually gone to bed at night?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID143',
        choices: [
            { text: 'Before 5:00 AM' },
            { text: '5:00 AM' },
            { text: '5:30 AM' },
            { text: '6:00 AM' },
            { text: '6:30 AM' },
            { text: '7:00 AM' },
            { text: '7:30 AM' },
            { text: '8:00 AM' },
            { text: '8:30 AM' },
            { text: '9:00 AM' },
            { text: '9:30 AM' },
            { text: '10:00 AM' },
            { text: '10:30 AM' },
            { text: '11:00 AM' },
            { text: 'After 11:00 AM' }
        ]
    }, {
        text: 'During the past month, how many hours of actual sleep did you get at night? (This may be different than the number of hours you spend in bed.)',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID94',
        choices: [
            { text: '< 4' },
            { text: '4' },
            { text: '4.5' },
            { text: '5' },
            { text: '5.5' },
            { text: '6' },
            { text: '6.5' },
            { text: '7' },
            { text: '7.5' },
            { text: '8' },
            { text: '8.5' },
            { text: '9' },
            { text: '9.5' },
            { text: '10' },
            { text: '10.5' },
            { text: '11' },
            { text: '11.5' },
            { text: '12' },
            { text: '> 12' }
        ]
    },
        frequencyQuestion('QID95_1', commonText + 'Cannot get to sleep within 30 minutes'),
        frequencyQuestion('QID95_2', commonText + 'Wake up in the middle of the night or early morning'),
        frequencyQuestion('QID95_3', commonText + 'Have to get up to use the bathroom'),
        frequencyQuestion('QID95_4', commonText + 'Cannot breathe comfortably'),
        frequencyQuestion('QID95_5', commonText + 'Cough or snore loudly'),
        frequencyQuestion('QID95_6', commonText + 'Feel too cold'),
        frequencyQuestion('QID95_7', commonText + 'Feel too hot'),
        frequencyQuestion('QID95_8', commonText + 'Had bad dreams'),
        frequencyQuestion('QID95_9', commonText + 'Have pain'),
        frequencyQuestion('QID95_10', commonText + 'Other reason(s), please describe'),
        goodQuestion('QID96', 'During the past month, how would you rate your sleep quality overall?'),
        frequencyQuestion('QID97', 'During the past month, how often have you taken medicine (prescribed or "over the counter") to help you sleep?'),
        frequencyQuestion('QID98', 'During the past month, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?'),  {
        text: 'During the past month, how many hours of actual sleep did you get at night? (This may be different than the number of hours you spend in bed.)',
            required: true,
            type: 'choice',
            answerIdentifier: 'QID145',
            choices: [
                { text: 'No problem at all' },
                { text: 'Only a very slight problem' },
                { text: 'Somewhat of a problem' },
                { text: 'A very big problem' }
            ]
        }, {
           required: true,
            type: 'choice',
            answerIdentifier: 'QID146',
            choices: [
                { text: 'No bed partner or roommate' },
                { text: 'Partner/roommate in other room' },
                { text: 'Partner in same room, but not same bed' },
                { text: 'Partner in same bed' }
            ]
        },
        frequencyQuestion('QID101_1', commonText2 + 'Loud snoring'),
        frequencyQuestion('QID101_2', commonText2 + 'Long pauses between breaths while asleep'),
        frequencyQuestion('QID101_3', commonText2 + 'Legs twitching or jerking while you sleep'),
        frequencyQuestion('QID101_4', commonText2 + 'Episodes of disorientation or confusion during sleep'),
        frequencyQuestion('QID101_5_TEXT', commonText2 + 'Other restlessness while you sleep; please describe'), {
            text: 'How many hours do you spend napping in a typical day?',
            required: true,
            type: 'choice',
            answerIdentifier: 'QID196',
            choices: [
                { text: 'None' },
                { text: 'Less than 1 hour' },
                { text: '1-2 hours' },
                { text: '2-3 hours' },
                { text: '3-4 hours' },
                { text: '4-5 hours' },
                { text: '5-6 hours' },
                { text: 'more than 6 hours'}
            ]
        }, {
            text: 'I feel sleepy during the day and struggle to remain alert.',
            required: true,
            type: 'choice',
            answerIdentifier: 'QID197',
            choices: [
                { text: 'Not At All' },
                { text: 'Somewhat' },
                { text: 'Rather Much' },
                { text: 'Very Much' }
            ]
        }
    ]
};
