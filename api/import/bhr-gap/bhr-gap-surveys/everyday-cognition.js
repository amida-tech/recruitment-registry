'use strict';

module.exports = {
    name: 'Everyday Cognition',
    identifier: {
        type: 'bhr-gap',
        value: 'everyday-cognition'
    },
    questions: [{
        text: 'Compared to 10 years ago, has there been any change in...MEMORY',
        required: false,
        type: 'choices',
        enumeration: 'change-for-worse',
        choices: [{
            text: 'Remembering a few shopping items without a list.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_1' }
        }, {
            text: 'Remembering things that happened recently (such as recent outings, events in the news).',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_2' }
        }, {
            text: 'Recalling conversations a few days later.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_3' }
        }, {
            text: 'Remembering where I have placed objects.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_4' }
        }, {
            text: 'Repeating stories and/or questions.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_5' }
        }, {
            text: 'Remembering the current date or day of the week.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_6' }
        }, {
            text: 'Remembering I have already told someone something.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_7' }
        }, {
            text: 'Remembering appointments, meetings, or engagements.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_8' }
        }]
    }, {
        text: 'Compared to 10 years ago, has there been any change in...LANGUAGE',
        required: false,
        type: 'choices',
        enumeration: 'change-for-worse-2',
        choices: [{
            text: 'Forgetting the names of objects.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_1' }
        }, {
            text: 'Verbally giving instructions to others.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_2' }
        }, {
            text: 'Finding the right words to use in a conversation.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_3' }
        }, {
            text: 'Communicating thoughts in a conversation.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_4' }
        }, {
            text: 'Following a story in a book or on TV.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_5' }
        }, {
            text: 'Understanding the point of what other people are trying to say.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_6' }
        }, {
            text: 'Remembering the meaning of common words.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_7' }
        }, {
            text: 'Describing a program I have watched on TV.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_8' }
        }, {
            text: 'Understanding spoken directions or instructions.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_9' }
        }]
    }, {
        text: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES',
        required: false,
        type: 'choices',
        enumeration: 'change-for-worse',
        choices: [{
            text: 'Following a map to find a new location.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_1' }
        }, {
            text: 'Reading a map and helping with directions when someone else is driving.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_2' }
        }, {
            text: 'Finding my car in a parking lot.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_3' }
        }, {
            text: 'Finding my way back to a meeting spot in the mall or other location.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_4' }
        }, {
            text: 'Finding my way around a familiar neighborhood.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_5' }
        }, {
            text: 'Finding my way around a familiar store.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_6' }
        }, {
            text: 'Finding my way around a house visited many times.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_7' }
        }]
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: PLANNING',
        required: false,
        type: 'choices',
        enumeration: 'change-for-worse',
        choices: [{
            text: 'Planning a sequence of stops on a shopping trip.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_1' }
        }, {
            text: 'The ability to anticipate weather changes and plan accordingly (i.e., bring a coat or umbrella).',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_2' }
        }, {
            text: 'Developing a schedule in advance of anticipated events.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_3' }
        }, {
            text: 'Thinking things through before acting.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_4' }
        }, {
            text: 'Thinking ahead.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_5' }
        }]
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION',
        required: false,
        type: 'choices',
        enumeration: 'change-for-worse',
        choices: [{
            text: 'Keeping living and work space organized.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_1' }
        }, {
            text: 'Balancing the checkbook without error.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_2' }
        }, {
            text: 'Keeping financial records organized.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_3' }
        }, {
            text: 'Prioritizing tasks by importance.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_4' }
        }, {
            text: 'Keeping mail and papers organized.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_5' }
        }, {
            text: 'Using an organized strategy to manage a medication schedule involving multiple medications.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_6' }
        }]
    }, {
        text: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: DIVIDED ATTENTION',
        required: false,
        type: 'choices',
        enumeration: 'change-for-worse',
        choices: [{
            text: 'The ability to do two things at once.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_1' }
        }, {
            text: 'Returning to a task after being interrupted.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_2' }
        }, {
            text: 'The ability to concentrate on a task without being distracted by external things in the environment.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_3' }
        }, {
            text: 'Cooking or working and talking at the same time.',
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_4' }
        }]
    }]
};
