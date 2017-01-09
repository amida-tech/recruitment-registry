'use strict';

const yes0No1Question = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Yes', numerical: 0 },
            { text: 'No', numerical: 1 }
        ]
    };
};

const yes1No0Question = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Yes', numerical: 1 },
            { text: 'No', numerical: 0 }
        ]
    };
};

const oftenQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Not at all', numerical: 0 },
            { text: 'Several days', numerical: 1 },
            { text: 'More than half the days', numerical: 2 },
            { text: 'Nearly every day', numerical: 3 }
        ]
    };
};

const difficultQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Not Difficult At All', numerical: 0 },
            { text: 'Somewhat Difficult', numerical: 1 },
            { text: 'Very Difficult', numerical: 2 },
            { text: 'Extremely Difficult', numerical: 3 }
        ]
    };
};

const commonText = 'Over the last 2 weeks, how often have you been bothered by any of the following problems? Read each item carefully, and select your response. ';

module.exports = {
    name: 'Mood',
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
        oftenQuestion('Q21_1', commonText + 'a. Little interest or pleasure in doing things'),
        oftenQuestion('Q21_2', commonText + 'b. Feeling down, depressed, or hopeless'),
        oftenQuestion('Q21_3', commonText + 'c. Trouble falling asleep, staying asleep, or sleeping too much'),
        oftenQuestion('Q21_4', commonText + 'd. Feeling tired or having little energy'),
        oftenQuestion('Q21_5', commonText + 'e. Poor appetite or overeating'),
        oftenQuestion('Q21_6', commonText + 'f. Feeling bad about yourself, feeling that you are a failure, or feeling that you have let yourself or your family down'),
        oftenQuestion('Q21_7', commonText + 'g. Trouble concentrating on things such as reading the newspaper or watching television'),
        oftenQuestion('Q21_8', commonText + 'h. Moving or speaking so slowly that other people could have noticed. Or being so fidgety or restless that you have been moving around a lot more than usual'),
        oftenQuestion('Q21_9', commonText + 'i. Thinking that you would be better off dead or that you want to hurt yourself in some way'),
        difficultQuestion('QID198', 'If you selected any of the above problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?')
    ]
};
