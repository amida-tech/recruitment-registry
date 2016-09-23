/* global describe,before,it*/
'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const shared = require('../shared-spec');

const expect = chai.expect;

describe('answer unit', function () {
    before(shared.setUpFn());

    const store = {
        users: [],
        questions: [],
        qxChoices: [],
        surveys: [],
        hxAnswers: {}
    };

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUser(store));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, shared.createQuestion(store));
    }

    const surveyQuestions = [
        [0, 1, 2, 3, 4],
        [4, 5, 6, 0],
        [7, 8, 9, 10, 11, 12],
        [9, 11, 13, 6],
        [14, 15, 16, 17, 18, 19]
    ];

    //const testQuestions = [{
    //    survey: [0, 1, 2, 3, 4],
    //    answerSequences: [
    //        [
    //            [0, 1, 2, 3, 4],
    //            [0, 1, 2, 3, 4]
    //        ]
    //    ]
    //}, {
    //    survey: [4, 5, 6, 0],
    //    answerSequences: [
    //        [
    //            [4, 5, 6, 0],
    //            [4, -6]
    //        ]
    //    ]
    //}, {
    //    survey: [7, 8, 9, 10, 11, 12],
    //    answerSequences: [
    //        [
    //            [8, 10, 11, 12],
    //            [7, 10, -12]
    //        ]
    //    ]
    //}, {
    //    survey: [9, 11, 13, 6],
    //    answerSequences: [
    //        [
    //            [9, 13],
    //            [6, 11]
    //        ],
    //        [
    //            [9, 11, 13, 6],
    //            [9, 11, -6]
    //        ]
    //    ]
    //}, {
    //    survey: [14, 15, 16, 17, 18, 19],
    //    answerSequences: [
    //        [
    //            [14, 15, 16, 17, 18, 19],
    //            [-15, 16, -17, -19]
    //        ]
    //    ]
    //}];

    surveyQuestions.forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, shared.createSurvey(store, surveyQuestion));
    });

    const genQuestionAnswer = (function () {
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

        return function (questionIndex) {
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

    const createTestFn = function (userIndex, surveyIndex, qxIndices, key) {
        return function () {
            const answers = qxIndices.map(genQuestionAnswer);
            store.hxAnswers[key] = [{ answers, qxIndices }];
            const input = {
                userId: store.users[userIndex],
                surveyId: store.surveys[surveyIndex],
                answers
            };
            return models.Answer.createAnswers(input)
                .then(function () {
                    return models.Answer.getSurveyAnswers({
                            userId: store.users[userIndex],
                            surveyId: store.surveys[surveyIndex]
                        })
                        .then(function (result) {
                            const expected = _.sortBy(answers, 'questionId');
                            const actual = _.sortBy(result, 'questionId');
                            expect(actual).to.deep.equal(expected);
                        });
                });
        };
    };

    it('user 0 answers survey 0 create full', createTestFn(0, 0, [0, 1, 2, 3, 4], 'a'));
    it('user 1 answers survey 1 create full', createTestFn(1, 1, [4, 5, 6, 0], 'b'));
    it('user 2 answers survey 2 create partial', createTestFn(2, 2, [8, 10, 11, 12], 'c'));
    it('user 3 answers survey 3 create partial', createTestFn(3, 3, [9, 13], 'd'));
    it('user 2 answers survey 4 create full', createTestFn(2, 4, [14, 15, 16, 17, 18, 19], 'e'));
    it('user 0 answers survey 3 create full', createTestFn(0, 3, [9, 11, 13, 6], 'f'));

    //const updateTestFn = function (userIndex, surveyIndex, qxIndices, key) {
    //return function () {
    //    const answers = qxIndices.map(genQuestionAnswer);
    //    store.updateAnswers[key].push({ answers, qxIndices });
    //    const input = {
    //        userId: store.users[userIndex],
    //        surveyId: store.surveys[surveyIndex],
    //        answers
    //    };
    //    return models.Answer.updateAnswers(input)
    //        .then(function () {
    //            return models.Answer.getSurveyAnswers({
    //                    userId: store.users[userIndex],
    //                    surveyId: store.surveys[surveyIndex]
    //                })
    //                .then(function (result) {
    //                    const expected = _.sortBy(answers, 'questionId');
    //                    const actual = _.sortBy(result, 'questionId');
    //                    expect(actual).to.deep.equal(expected);
    //                });
    //        });
    //};
    //};

    //xit('user 0 answers survey 0 answer 1', updateTestFn(0, 0, testQuestions.answerSequences[0][1], 'a'));
    //xit('user 1 answers survey 1 answer 1', updateTestFn(1, 1, testQuestions.answerSequences[1][1], 'b'));
    //xit('user 2 answers survey 2 answer 1', updateTestFn(2, 2, testQuestions.answerSequences[2][1], 'c'));
    //xit('user 3 answers survey 3 answer 1', updateTestFn(3, 3, testQuestions.answerSequences[3][1], 'd'));
    //xit('user 2 answers survey 4 answer 1', updateTestFn(2, 4, testQuestions.answerSequences[4][1], 'e'));
    //xit('user 0 answers survey 3 answer 1', updateTestFn(0, 3, testQuestions.answerSequences[3][1], 'f'));
});
