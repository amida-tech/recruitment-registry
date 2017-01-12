'use strict';

const cognitionChoices = [
    { text: 'Better or no change' },
    { text: 'Questionable/ occasionally worse' },
    { text: 'Consistently a little worse' },
    { text: 'Consistently much worse' },
    { text: 'I don\'t know' }
];

const cognitionChoicesNumerical = [
    { text: 'Better or no change', numerical: 8 },
    { text: 'Questionable/ occasionally worse', numerical: 2 },
    { text: 'Consistently a little worse', numerical: 3 },
    { text: 'Consistently much worse', numerical: 4 },
    { text: 'I don\'t know', numerical: 5 }
];

module.exports = {
    name: 'Everyday Cognition',
    questions: [{
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Remembering a few shopping items without a list.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_1',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Remembering things that happened recently (such as recent outings, events in the news).',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_2',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Recalling conversations a few days later.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_3',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Remembering where I have placed objects.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_4',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Repeating stories and/or questions.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_5',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Remembering the current date or day of the week.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_6',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Remembering I have already told someone something.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_7',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...MEMORY Remembering appointments, meetings, or engagements.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID49_8',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Forgetting the names of objects.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_1',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Verbally giving instructions to others.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_2',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Finding the right words to use in a conversation.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_3',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Communicating thoughts in a conversation.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_4',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Following a story in a book or on TV.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_5',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Understanding the point of what other people are trying to say.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_6',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Remembering the meaning of common words.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_7',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Describing a program I have watched on TV.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_8',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE Understanding spoken directions or instructions.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID50_9',
        choices: cognitionChoicesNumerical
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES Following a map to find a new location.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID51_1',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES Reading a map and helping with directions when someone else is driving.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID51_2',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES Finding my car in a parking lot.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID51_3',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES Finding my way back to a meeting spot in the mall or other location.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID51_4',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES Finding my way around a familiar neighborhood.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID51_5',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES Finding my way around a familiar store.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID51_6',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES Finding my way around a house visited many times.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID51_7',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: PLANNING Planning a sequence of stops on a shopping trip.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID52_1',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: PLANNING The ability to anticipate weather changes and plan accordingly (i.e., bring a coat or umbrella).',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID52_2',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: PLANNING Developing a schedule in advance of anticipated events.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID52_3',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: PLANNING Thinking things through before acting.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID52_4',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: PLANNING Thinking ahead.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID52_5',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION Keeping living and work space organized.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID53_1',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION Balancing the checkbook without error.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID53_2',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION Keeping financial records organized.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID53_3',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION Prioritizing tasks by importance.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID53_4',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION Keeping mail and papers organized.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID53_5',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION Using an organized strategy to manage a medication schedule involving multiple medications.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID53_6',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: DIVIDED ATTENTION The ability to do two things at once.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID54_1',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: DIVIDED ATTENTION Returning to a task after being interrupted.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID54_2',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: DIVIDED ATTENTION The ability to concentrate on a task without being distracted by external things in the environment.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID54_3',
        choices: cognitionChoices
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: DIVIDED ATTENTION Cooking or working and talking at the same time.',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID54_4',
        choices: cognitionChoices
    }]
};
