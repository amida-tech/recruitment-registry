'use strict';

const _ = require('lodash');

const jsutil = require('../../lib/jsutil');

exports.testQuestions = [{
    survey: [0, 1, 2, 3, 4],
    answerSequences: [
        [
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [-1, -2]
        ]
    ]
}, {
    survey: [4, 5, 6, 0],
    answerSequences: [
        [
            [4, 5, 6, 0],
            [4, -6],
            [6, 0]
        ]
    ]
}, {
    survey: [7, 8, 9, 10, 11, 12],
    answerSequences: [
        [
            [8, 10, 11, 12],
            [7, 10, -12],
            [9, 10, 11, -8]
        ]
    ]
}, {
    survey: [9, 11, 13, 6],
    answerSequences: [
        [
            [9, 13],
            [6, 11],
            [-9, 11]
        ],
        [
            [9, 11, 13, 6],
            [9, 11, -6],
            [11, 13]
        ]
    ]
}, {
    survey: [14, 15, 16, 17, 18, 19],
    answerSequences: [
        [
            [14, 15, 16, 17, 18, 19],
            [-15, 16, -17, -19],
            [14, 17, 19]
        ]
    ]
}];

exports.generateQxAnswer = (function () {
    let answerIndex = -1;
    let choicesCountIndex = 0;

    const genAnswer = {
        text: function (question) {
            ++answerIndex;
            return {
                questionId: question.id,
                answer: {
                    textValue: `text_${answerIndex}`
                }
            };
        },
        bool: function (question) {
            ++answerIndex;
            return {
                questionId: question.id,
                answer: {
                    boolValue: answerIndex % 2 === 0
                }
            };
        },
        choice: function (question) {
            ++answerIndex;
            return {
                questionId: question.id,
                answer: {
                    choice: question.choices[answerIndex % question.choices.length]
                }
            };
        },
        choices: function (question) {
            ++answerIndex;
            choicesCountIndex = (choicesCountIndex + 1) % 3;
            const choices = _.range(choicesCountIndex + 1).map(function () {
                ++answerIndex;
                return question.choices[answerIndex % question.choices.length];
            });

            return {
                questionId: question.id,
                answer: {
                    choices: _.sortBy(choices)
                }
            };
        },
        choicesplus: function (question) {
            const result = this.choices(question);
            result.answer.textValue = `text_${answerIndex}`;
            return result;
        }
    };

    return function (store, questionIndex) {
        if (questionIndex < 0) {
            const question = store.questions[-questionIndex];
            return {
                questionId: question.id
            };
        } else {
            const question = store.questions[questionIndex];
            return genAnswer[question.type](question);
        }
    };
})();

exports.updateHxAnswers = function (store, key, qxIndices, answers) {
    const hx = store.hxAnswers[key] || (store.hxAnswers[key] = []);
    const qxAnswers = answers.reduce((r, answer, index) => {
        const qxIndex = qxIndices[index];
        if (qxIndex >= 0) {
            r[qxIndex] = answer;
        }
        return r;
    }, {});
    hx.push({ qxIndices, qxAnswers });
};

exports.pullExpectedAnswers = function (store, key) {
    const answersSpec = store.hxAnswers[key];
    const standing = jsutil.findStanding(_.map(answersSpec, 'qxIndices'));
    return standing.reduce((r, answerIndices, index) => {
        answerIndices.forEach((answerIndex) => {
            const answer = answersSpec[index].qxAnswers[answerIndex];
            r.push(answer);
        });
        return r;
    }, []);
};
