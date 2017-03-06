'use strict';

const yes0No1Question = function (identifier, text) {
    return {
        text,
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-mood-column', value: identifier },
        choiceSetReference: 'yes-no-0-1',
    };
};

const yes1No0Question = function (identifier, text) {
    return {
        text,
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-mood-column', value: identifier },
        choiceSetReference: 'yes-no-1-0',
    };
};

const difficultQuestion = function (identifier, text) {
    return {
        text,
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-mood-column', value: identifier },
        choiceSetReference: 'difficulty-level',
    };
};

module.exports = {
    name: 'Mood',
    identifier: {
        type: 'bhr-gap',
        value: 'mood',
    },
    sections: [{
        questions: [
            yes0No1Question('QID56', 'Are you basically satisfied with your life?'),
            yes1No0Question('QID57', 'Have you dropped many of your activities and interests?'),
            yes1No0Question('QID58', 'Do you feel that your life is empty?'),
            yes1No0Question('QID59', 'Do you often get bored?'),
            yes0No1Question('QID60', 'Are you in good spirits most of the time?'),
            yes1No0Question('QID61', 'Are you afraid that something bad is going to happen to you?'),
            yes0No1Question('QID62', 'Do you feel happy most of the time?'),
            yes1No0Question('QID63', 'Do you often feel helpless?'),
            yes1No0Question('QID64', 'Do you prefer to stay at home, rather than going out and doing new things?'),
            yes1No0Question('QID65', 'Do you feel you have more problems with memory than most?'),
            yes0No1Question('QID66', 'Do you think it\'s wonderful to be alive now?'),
            yes1No0Question('QID67', 'Do you feel pretty worthless the way you are now?'),
            yes0No1Question('QID68', 'Do you feel full of energy?'),
            yes1No0Question('QID69', 'Do you feel that your situation is hopeless?'),
            yes1No0Question('QID70', 'Do you think that most people are better off than you are?'),
        ],
    }, {
        name: 'Over the last 2 weeks, how often have you been bothered by any of the following problems? Read each item carefully, and select your response.',
        questions: [{
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_1' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'a. Little interest or pleasure in doing things',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_2' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'b. Feeling down, depressed, or hopeless',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_3' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'c. Trouble falling asleep, staying asleep, or sleeping too much',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_4' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'd. Feeling tired or having little energy',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_5' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'e. Poor appetite or overeating',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_6' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'f. Feeling bad about yourself, feeling that you are a failure, or feeling that you have let yourself or your family down',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_7' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'g. Trouble concentrating on things such as reading the newspaper or watching television',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_8' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'h. Moving or speaking so slowly that other people could have noticed. Or being so fidgety or restless that you have been moving around a lot more than usual',
        }, {
            answerIdentifier: { type: 'bhr-gap-mood-column', value: 'Q21_9' },
            type: 'choice-ref',
            required: false,
            choiceSetReference: 'frequency-daily',
            text: 'i. Thinking that you would be better off dead or that you want to hurt yourself in some way',
        }],
    }, {
        questions: [
            difficultQuestion('QID198', 'If you selected any of the above problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?'),
        ],
    }],
};
