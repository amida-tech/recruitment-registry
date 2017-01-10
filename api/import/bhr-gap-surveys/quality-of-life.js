'use strict';

const yesNoQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Yes' },
            { text: 'No' }
        ]
    };
};

const limitedQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'All of the time' },
            { text: 'Most of the time' },
            { text: 'No, not limited at al' },
            { text: 'Some of the time' },
            { text: 'A little of the time' },
            { text: 'None of the time' }
        ]
    };
};

const limited2Question = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'All of the time' },
            { text: 'Most of the time' },
            { text: 'A good bit of the time' },
            { text: 'A little of the time' },
            { text: 'None of the time' }
        ]
    };
};

const howMuchQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Yes, limited a lot' },
            { text: 'Yes, limited a little' },
            { text: 'No, not limited at al' }
        ]
    };
};

const trueQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Definitely True' },
            { text: 'Mostly True' },
            { text: 'Don\'t Know' },
            { text: 'Mostly False' },
            { text: 'Definitely False' }
        ]
    };
};

const commonText = 'The following items are about activities you might do during a typical day. Does your health now limit you in these activities?  If so, how much? ';
const commonText2 = 'During the past 4 weeks, have you had any of the following problems with your work or other regular daily activities as a result of your physical health? ';
const commonText3 = 'During the past 4 weeks, have you had any of the following problems with your work or other regular daily activities as a result of any emotional problems (such as feeling depressed or anxious)? ';
const commonText4 = 'These questions are about how you feel and how things have been with you during the past 4 weeks.  For each question, please give the one answer that comes closest to the way you have been feeling. How much of the time during the past 4 weeks... ';
const commonText5 = 'These questions are about how you feel and how things have been with you during the past 4 weeks.  For each question, please give the one answer that comes closest to the way you have been feeling. How much of the time during the past 4 weeks... ';

module.exports = {
    name: 'QualityOfLife',
    questions: [{
            text: 'In general, would you say your health is:',
            required: false,
            type: 'choice',
            answerIdentifier: 'QID80',
            oneOfchoices: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
        }, {
            text: 'Compared to one year ago, how would you rate your health in general now?',
            required: false,
            type: 'choice',
            answerIdentifier: 'QID81',
            oneOfchoices: [
                'Much better now than one year ago',
                'Somewhat better than one year ago',
                'About the same',
                'Somewhat worse now than one year ago',
                'Much worse now than one year ago'
            ]
        },
        limitedQuestion('QID82_1', commonText + 'Vigorous activities, such as running, lifting heavy objects, participating in strenuous sports'),
        limitedQuestion('QID82_2', commonText + 'Moderate activities, such as moving a table, pushing a vacuum cleaner, bowling, or playing golf'),
        limitedQuestion('QID82_3', commonText + 'Lifting or carrying groceries'),
        limitedQuestion('QID82_4', commonText + 'Climbing several flights of stairs'),
        limitedQuestion('QID82_5', commonText + 'Climbing one flight of stairs'),
        limitedQuestion('QID82_6', commonText + 'Bending, kneeling, or stooping'),
        limitedQuestion('QID82_7', commonText + 'Walking more than a mile'),
        limitedQuestion('QID82_8', commonText + 'Walking several blocks'),
        limitedQuestion('QID82_9', commonText + 'Walking one block'),
        limitedQuestion('QID82_10', commonText + 'Bathing or dressing yourself'),
        yesNoQuestion('QID83_1', commonText2 + 'Cut down the amount of time you spent on work or other activities'),
        yesNoQuestion('QID83_2', commonText2 + 'Accomplished less than you would like'),
        yesNoQuestion('QID83_3', commonText2 + 'Were limited in the kind of work or other activities'),
        yesNoQuestion('QID83_4', commonText2 + 'Had difficulty performing the work or other activities (for example, it took extra effort)'),
        yesNoQuestion('QID84_1', commonText3 + 'Cut down the amount of time you spent on work or other activities'),
        yesNoQuestion('QID84_2', commonText3 + 'Accomplished less than you would like'),
        yesNoQuestion('QID84_3', commonText3 + 'Didn\'t do work or other activities as carefully as usual'), {
            text: 'During the past 4 weeks, to what extent has your physical health or emotional problems interfered with your normal social activities with family, friends, neighbors, or groups?',
            required: false,
            type: 'choice',
            answerIdentifier: 'QID85',
            oneOfchoices: [
                'Not at all',
                'Slightly',
                'Moderately',
                'Quite a bit',
                'Extremely'
            ]
        }, {
            text: 'How much bodily pain have you had during the past 4 weeks?',
            required: false,
            type: 'choice',
            answerIdentifier: 'QID86',
            oneOfchoices: [
                'None', 'Very mild', 'Mild', 'Moderate', 'Severe', 'Very severe'
            ]
        }, {
            text: 'During the past 4 weeks, how much did pain interfere with your normal work (including both work outside the home and housework)?',
            required: false,
            type: 'choice',
            answerIdentifier: 'QID87',
            oneOfchoices: [
                'Not at all', 'A little bit', 'Moderately', 'Quite a bit', 'Extremely'
            ]
        },
        howMuchQuestion('QID140_1', commonText4 + 'Did you feel full of pep?'),
        howMuchQuestion('QID140_2', commonText4 + 'Have you been a very nervous person?'),
        howMuchQuestion('QID140_3', commonText4 + 'Have you felt so down in the dumps that nothing could cheer you up?'),
        howMuchQuestion('QID140_4', commonText4 + 'Have you felt calm and peaceful?'),
        howMuchQuestion('QID140_5', commonText4 + 'Did you have a lot of energy?'),
        howMuchQuestion('QID140_6', commonText4 + 'Have you felt downhearted and blue?'),
        howMuchQuestion('QID140_7', commonText4 + 'Did you feel worn out?'),
        howMuchQuestion('QID140_8', commonText4 + 'Have you been a happy person?'),
        howMuchQuestion('QID140_9', commonText4 + 'Did you feel tired?'),
        limited2Question('QID88', 'During the past 4 weeks, how much of the time has your physical health or emotional problems interfered with your social activities (like visiting with friends, relatives, etc.)?'),
        trueQuestion('QID89_1', commonText5 + 'I seem to get sick a little easier than other people'),
        trueQuestion('QID89_2', commonText5 + 'I am as healthy as anybody I know'),
        trueQuestion('QID89_3', commonText5 + 'I expect my health to get worse'),
        trueQuestion('QID89_4', commonText5 + 'My health is excellent'),
    ]
};
