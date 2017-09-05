'use strict';

module.exports = {
    name: 'QualityOfLife',
    identifier: {
        type: 'bhr-gap',
        value: 'quality-of-life',
    },
    sections: [{
        questions: [{
            text: 'In general, would you say your health is:',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID80' },
            choiceSetReference: 'condition',
        }, {
            text: 'Compared to one year ago, how would you rate your health in general now?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID81' },
            choiceSetReference: 'comparative-condition-year',
        }],
    }, {
        name: 'The following items are about activities you might do during a typical day. Does your health now limit you in these activities?  If so, how much?',
        questions: [{
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_1' },
            text: 'Vigorous activities, such as running, lifting heavy objects, participating in strenuous sports',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_2' },
            text: 'Moderate activities, such as moving a table, pushing a vacuum cleaner, bowling, or playing golf',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_3' },
            text: 'Lifting or carrying groceries',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_4' },
            text: 'Climbing several flights of stairs',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_5' },
            text: 'Climbing one flight of stairs',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_6' },
            text: 'Bending, kneeling, or stooping',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_7' },
            text: 'Walking more than a mile',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_8' },
            text: 'Walking several blocks',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_9' },
            text: 'Walking one block',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID82_10' },
            text: 'Bathing or dressing yourself',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-limited',
        }],
    }, {
        name: 'During the past 4 weeks, have you had any of the following problems with your work or other regular daily activities as a result of your physical health?',
        questions: [{
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID83_1' },
            text: 'Cut down the amount of time you spent on work or other activities',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID83_2' },
            text: 'Accomplished less than you would like',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID83_3' },
            text: 'Were limited in the kind of work or other activities',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID83_4' },
            text: 'Had difficulty performing the work or other activities (for example, it took extra effort)',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }],
    }, {
        name: 'During the past 4 weeks, have you had any of the following problems with your work or other regular daily activities as a result of any emotional problems (such as feeling depressed or anxious)?',
        questions: [{
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID84_1' },
            text: 'Cut down the amount of time you spent on work or other activities',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID84_2' },
            text: 'Accomplished less than you would like',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID84_3' },
            text: 'Didn\'t do work or other activities as carefully as usual',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }],
    }, {
        questions: [{
            text: 'During the past 4 weeks, to what extent has your physical health or emotional problems interfered with your normal social activities with family, friends, neighbors, or groups?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID85' },
            choiceSetReference: 'interference',
        }],
    }, {
        questions: [{
            text: 'How much bodily pain have you had during the past 4 weeks?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID86' },
            choiceSetReference: 'severity',
        }],
    }, {
        questions: [{
            text: 'During the past 4 weeks, how much did pain interfere with your normal work (including both work outside the home and housework)?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID87' },
            choiceSetReference: 'interference',
        }],
    }, {
        name: 'These questions are about how you feel and how things have been with you during the past 4 weeks.  For each question, please give the one answer that comes closest to the way you have been feeling. How much of the time during the past 4 weeks... ',
        questions: [{
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_1' },
            text: 'Did you feel full of pep?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_2' },
            text: 'Have you been a very nervous person?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_3' },
            text: 'Have you felt so down in the dumps that nothing could cheer you up?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_4' },
            text: 'Have you felt calm and peaceful?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_5' },
            text: 'Did you have a lot of energy?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_6' },
            text: 'Have you felt downhearted and blue?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_7' },
            text: 'Did you feel worn out?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_8' },
            text: 'Have you been a happy person?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID140_9' },
            text: 'Did you feel tired?',
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'frequency-time-6',
        }],
    }, {
        questions: [{
            text: 'During the past 4 weeks, how much of the time has your physical health or emotional problems interfered with your social activities (like visiting with friends, relatives, etc.)?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID88' },
            choiceSetReference: 'frequency-time-5',
        }],
    }, {
        name: 'How TRUE or FALSE is each of the following statements for you?',
        questions: [{
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID89_1' },
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-true',
            text: 'I seem to get sick a little easier than other people',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID89_2' },
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-true',
            text: 'I am as healthy as anybody I know',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID89_3' },
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-true',
            text: 'I expect my health to get worse',
        }, {
            answerIdentifier: { type: 'bhr-gap-quality-of-life-column', value: 'QID89_4' },
            required: false,
            type: 'choice-ref',
            choiceSetReference: 'how-true',
            text: 'My health is excellent',
        }],
    }],
};
