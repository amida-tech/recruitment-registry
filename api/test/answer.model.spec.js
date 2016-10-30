/* global describe,before,it*/
'use strict';

const chai = require('chai');
const _ = require('lodash');

const dao = require('../dao');
const SharedSpec = require('./util/shared-spec');
const AnswerHistory = require('./util/answer-history');
const answerCommon = require('./util/answer-common');

const expect = chai.expect;
const shared = new SharedSpec();

describe('answer unit', function () {
    const testQuestions = answerCommon.testQuestions;
    const hxAnswer = new AnswerHistory(testQuestions);

    const hxUser = hxAnswer.hxUser;
    const hxQuestion = hxAnswer.hxQuestion;
    const hxSurvey = hxAnswer.hxSurvey;

    before(shared.setUpFn());

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUser(hxUser));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, shared.createQuestion(hxQuestion));
    }

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, shared.createSurvey(hxSurvey, hxQuestion, surveyQuestion));
    });

    const createTestFn = function (userIndex, surveyIndex, seqIndex, stepIndex) {
        return function () {
            const { answers, language } = hxAnswer.generateAnswers(userIndex, surveyIndex, seqIndex, stepIndex);
            const input = {
                userId: hxUser.id(userIndex),
                surveyId: hxSurvey.id(surveyIndex),
                answers
            };
            if (language) {
                input.language = language;
            }
            return dao.answer.createAnswers(input)
                .then(function () {
                    return dao.answer.getAnswers({
                            userId: hxUser.id(userIndex),
                            surveyId: hxSurvey.id(surveyIndex)
                        })
                        .then(function (result) {
                            const expected = hxAnswer.expectedAnswers(userIndex, surveyIndex, seqIndex);
                            const actual = _.sortBy(result, 'questionId');
                            expect(actual).to.deep.equal(expected);
                        });
                });
        };
    };

    const updateTestFn = function (userIndex, surveyIndex, seqIndex, stepIndex) {
        return function () {
            const { answers, language } = hxAnswer.generateAnswers(userIndex, surveyIndex, seqIndex, stepIndex);
            const input = {
                userId: hxUser.id(userIndex),
                surveyId: hxSurvey.id(surveyIndex),
                answers
            };
            if (language) {
                input.language = language;
            }
            return dao.answer.createAnswers(input)
                .then(function () {
                    return dao.answer.getAnswers({
                            userId: hxUser.id(userIndex),
                            surveyId: hxSurvey.id(surveyIndex)
                        })
                        .then(function (result) {
                            const expected = hxAnswer.expectedAnswers(userIndex, surveyIndex, seqIndex);
                            const actual = _.sortBy(result, 'questionId');
                            expect(actual).to.deep.equal(expected);
                        })
                        .then(() => dao.answer.getOldAnswers({
                            userId: hxUser.id(userIndex),
                            surveyId: hxSurvey.id(surveyIndex)
                        }))
                        .then((actual) => {
                            const expectedAnswers = hxAnswer.expectedRemovedAnswers(userIndex, surveyIndex, seqIndex);
                            const keys = Object.keys(expectedAnswers).sort();
                            const expected = {};
                            keys.forEach(key => {
                                const value = _.sortBy(expectedAnswers[key], 'questionId');
                                if (value.length) {
                                    expected[key] = value;
                                }
                            });
                            const expectedKeys = _.sortBy(Object.keys(expectedAnswers), r => Number(r));
                            const actualKeys = _.sortBy(Object.keys(actual), r => Number(r));
                            expect(actualKeys.length).to.equal(expectedKeys.length);
                            for (let i = 0; i < expectedKeys.length; ++i) {
                                const modifiedAnswers = AnswerHistory.prepareClientAnswers(expectedAnswers[expectedKeys[i]]);
                                expect(actual[actualKeys[i]]).to.deep.equal(modifiedAnswers);
                            }
                        });
                });
        };
    };

    const cases = [
        { userIndex: 0, surveyIndex: 0, seqIndex: 0 },
        { userIndex: 1, surveyIndex: 1, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 2, seqIndex: 0 },
        { userIndex: 3, surveyIndex: 3, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 4, seqIndex: 0 },
        { userIndex: 0, surveyIndex: 3, seqIndex: 1 },
    ];

    for (let i = 0; i < cases.length; ++i) {
        const { userIndex, surveyIndex, seqIndex } = cases[i];
        const msg = `user ${userIndex} answers survey ${surveyIndex}-${seqIndex} step 0`;
        it(msg, createTestFn(userIndex, surveyIndex, seqIndex, 0));
    }

    for (let j = 1; j < 3; ++j) {
        for (let i = 0; i < cases.length; ++i) {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            const msg = `user ${userIndex} answers survey ${surveyIndex}-${seqIndex} step ${j}`;
            it(msg, updateTestFn(userIndex, surveyIndex, seqIndex, j));
        }
    }
});
