'use strict';

module.exports = {
    name: 'Sleep',
    identifier: {
        type: 'bhr-gap',
        value: 'sleep'
    },
    questions: [{
            text: 'During the past month, when have you usually gone to bed at night?',
            required: false,
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID141' },
            enumeration: 'sleep-time'
        }, {
            text: 'During the past month, how long (in minutes) has it usually taken you to fall asleep each night?',
            required: true,
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID142' },
            enumeration: 'duration-5-minutes'
        }, {
            text: 'During the past month, when have you usually gotten up in the morning?',
            required: true,
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID143' },
            enumeration: 'wakeup-time'
        }, {
            text: 'During the past month, how many hours of actual sleep did you get at night? (This may be different than the number of hours you spend in bed.)',
            required: true,
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID94' },
            enumeration: 'amount-3-12-.5'
        }, {
            text: 'During the past month, how often have you had trouble sleeping because you...',
            required: false,
            type: 'choices',
            enumeration: 'frequency-weekly',
            choices: [{
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_1' },
                text: 'Cannot get to sleep within 30 minutes',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_2' },
                text: 'Wake up in the middle of the night or early morning',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_3' },
                text: 'Have to get up to use the bathroom',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_4' },
                text: 'Cannot breathe comfortably',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_5' },
                text: 'Cough or snore loudly',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_6' },
                text: 'Feel too cold',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_7' },
                text: 'Feel too hot',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_8' },
                text: 'Had bad dreams',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_9' },
                text: 'Have pain',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_10' },
                text: 'Other reason(s), please describe',
            }]
        }, {
            text: 'If other reason, please describe',
            type: 'text',
            required: false,
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID95_10_TEXT' }
        }, {
            text: 'During the past month, how would you rate your sleep quality overall?',
            type: 'enumeration',
            required: false,
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID96' },
            enumeration: 'condition-4'
        }, {
            text: 'During the past month, how often have you taken medicine (prescribed or "over the counter") to help you sleep?',
            type: 'enumeration',
            required: false,
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID97' },
            enumeration: 'frequency-weekly'
        }, {
            text: 'During the past month, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?',
            type: 'enumeration',
            required: false,
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID98' },
            enumeration: 'frequency-weekly'
        }, {
            text: 'During the past month, how much of a problem has it been for you to keep up enough enthusiasm to get things done?',
            type: 'enumeration',
            required: false,
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID145' },
            enumeration: 'is-problem'
        }, {
            text: 'Do you have a bed partner or roommate?',
            type: 'enumeration',
            required: false,
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID146' },
            enumeration: 'bed-partner'
        }, {
            text: 'If you have a roommate or bed partner, ask him/her how often in the past month you have had...',
            required: false,
            type: 'choices',
            enumeration: 'frequency-weekly',
            choices: [{
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID101_1' },
                text: 'Loud snoring',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID101_2' },
                text: 'Long pauses between breaths while asleep',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID101_3' },
                text: 'Legs twitching or jerking while you sleep',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID101_4' },
                text: 'Other restlessness while you sleep; please describe',
            }, {
                type: 'enumeration',
                answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID101_5' },
                text: 'Other restlessness while you sleep',
            }]
        }, {
            text: 'If other reason, please describe',
            type: 'text',
            required: false,
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID101_5_TEXT' }
        }, {
            text: 'How many hours do you spend napping in a typical day?',
            required: false,
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID196' },
            enumeration: 'duration-hour'
        }, {
            text: 'I feel sleepy during the day and struggle to remain alert.',
            required: false,
            type: 'enumeration',
            answerIdentifier: { type: 'bhr-gap-sleep-column', value: 'QID197' },
            enumeration: 'much-to-none'
        }
    ]
};
