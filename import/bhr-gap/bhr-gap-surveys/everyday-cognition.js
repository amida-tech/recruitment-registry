'use strict';

module.exports = {
    name: 'Everyday Cognition',
    identifier: {
        type: 'bhr-gap',
        value: 'everyday-cognition'
    },
    sections: [{
        name: 'Compared to 10 years ago, has there been any change in...MEMORY',
        questions: [{
            text: 'Remembering a few shopping items without a list.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_1' }
        }, {
            text: 'Remembering things that happened recently (such as recent outings, events in the news).',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_2' }
        }, {
            text: 'Recalling conversations a few days later.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_3' }
        }, {
            text: 'Remembering where I have placed objects.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_4' }
        }, {
            text: 'Repeating stories and/or questions.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_5' }
        }, {
            text: 'Remembering the current date or day of the week.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_6' }
        }, {
            text: 'Remembering I have already told someone something.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_7' }
        }, {
            text: 'Remembering appointments, meetings, or engagements.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID49_8' }
        }]
    }, {
        name: 'Compared to 10 years ago, has there been any change in...LANGUAGE',
        questions: [{
            text: 'Forgetting the names of objects.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_1' }
        }, {
            text: 'Verbally giving instructions to others.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_2' }
        }, {
            text: 'Finding the right words to use in a conversation.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_3' }
        }, {
            text: 'Communicating thoughts in a conversation.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_4' }
        }, {
            text: 'Following a story in a book or on TV.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_5' }
        }, {
            text: 'Understanding the point of what other people are trying to say.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_6' }
        }, {
            text: 'Remembering the meaning of common words.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_7' }
        }, {
            text: 'Describing a program I have watched on TV.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_8' }
        }, {
            text: 'Understanding spoken directions or instructions.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse-2',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID50_9' }
        }]
    }, {
        name: 'Compared to 10 years ago, has there been any change in...VISUAL-SPATIAL AND PERCEPTUAL ABILITIES',
        questions: [{
            text: 'Following a map to find a new location.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_1' }
        }, {
            text: 'Reading a map and helping with directions when someone else is driving.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_2' }
        }, {
            text: 'Finding my car in a parking lot.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_3' }
        }, {
            text: 'Finding my way back to a meeting spot in the mall or other location.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_4' }
        }, {
            text: 'Finding my way around a familiar neighborhood.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_5' }
        }, {
            text: 'Finding my way around a familiar store.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_6' }
        }, {
            text: 'Finding my way around a house visited many times.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID51_7' }
        }]
    }, {
        name: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: PLANNING',
        questions: [{
            text: 'Planning a sequence of stops on a shopping trip.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_1' }
        }, {
            text: 'The ability to anticipate weather changes and plan accordingly (i.e., bring a coat or umbrella).',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_2' }
        }, {
            text: 'Developing a schedule in advance of anticipated events.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_3' }
        }, {
            text: 'Thinking things through before acting.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_4' }
        }, {
            text: 'Thinking ahead.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID52_5' }
        }]
    }, {
        name: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: ORGANIZATION',
        questions: [{
            text: 'Keeping living and work space organized.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_1' }
        }, {
            text: 'Balancing the checkbook without error.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_2' }
        }, {
            text: 'Keeping financial records organized.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_3' }
        }, {
            text: 'Prioritizing tasks by importance.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_4' }
        }, {
            text: 'Keeping mail and papers organized.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_5' }
        }, {
            text: 'Using an organized strategy to manage a medication schedule involving multiple medications.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID53_6' }
        }]
    }, {
        name: 'Compared to 10 years ago, has there been any change in...EXECUTIVE FUNCTIONING: DIVIDED ATTENTION',
        questions: [{
            text: 'The ability to do two things at once.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_1' }
        }, {
            text: 'Returning to a task after being interrupted.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_2' }
        }, {
            text: 'The ability to concentrate on a task without being distracted by external things in the environment.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_3' }
        }, {
            text: 'Cooking or working and talking at the same time.',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'change-for-worse',
            answerIdentifier: { type: 'bhr-gap-everyday-cognition-column', value: 'QID54_4' }
        }]
    }]
};
