/* global describe,before,it*/
'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const shared = require('../shared-spec');
const jsutil = require('../../lib/jsutil');
const answerCommon = require('./answer-common');

const expect = chai.expect;

describe('answer unit', function () {
    const store = {
        users: [],
        questions: [],
        qxChoices: [],
        surveys: [],
        hxAnswers: {}
    };

    const generateQxAnswer = _.partial(answerCommon.generateQxAnswer, store);

    before(shared.setUpFn());

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUser(store));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, shared.createQuestion(store));
    }

    const testQuestions = answerCommon.testQuestions;

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, shared.createSurvey(store, surveyQuestion));
    });

    const updateHxAnswers = answerCommon.updateHxAnswers;

    const createTestFn = function (userIndex, surveyIndex, seqIndex, stepIndex) {
        return function () {
            const qxIndices = testQuestions[surveyIndex].answerSequences[seqIndex][stepIndex];
            const key = `${userIndex}_${surveyIndex}_${seqIndex}`;
            const answers = qxIndices.map(generateQxAnswer);
            updateHxAnswers(store, key, qxIndices, answers);
            const input = {
                userId: store.users[userIndex],
                surveyId: store.surveys[surveyIndex],
                answers
            };
            return models.Answer.createAnswers(input)
                .then(function () {
                    return models.Answer.getAnswers({
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

    const pullExpectedAnswers = answerCommon.pullExpectedAnswers;

    const pullExpectedRemovedAnswers = function (key) {
        const answersSpec = store.hxAnswers[key];
        const removed = jsutil.findRemoved(_.map(answersSpec, 'qxIndices'));
        const result = removed.reduce((r, answerIndices, index) => {
            answerIndices.forEach((answerIndex) => {
                if (answerIndex.removed.length) {
                    const timeIndex = answerIndex.timeIndex;
                    const arr = r[timeIndex] || (r[timeIndex] = []);
                    const answers = answerIndex.removed.map(r => answersSpec[index].qxAnswers[r]);
                    arr.push(...answers);
                    arr.sort((a, b) => a.questionId - b.questionId);
                }
            });
            return r;
        }, {});
        return result;
    };

    const updateTestFn = function (userIndex, surveyIndex, seqIndex, stepIndex) {
        return function () {
            const qxIndices = testQuestions[surveyIndex].answerSequences[seqIndex][stepIndex];
            const key = `${userIndex}_${surveyIndex}_${seqIndex}`;
            const answers = qxIndices.map(generateQxAnswer);
            updateHxAnswers(store, key, qxIndices, answers);
            const input = {
                userId: store.users[userIndex],
                surveyId: store.surveys[surveyIndex],
                answers
            };
            return models.Answer.updateAnswers(input)
                .then(function () {
                    return models.Answer.getAnswers({
                            userId: store.users[userIndex],
                            surveyId: store.surveys[surveyIndex]
                        })
                        .then(function (result) {
                            const expectedAnswers = pullExpectedAnswers(store, key);
                            const expected = _.sortBy(expectedAnswers, 'questionId');
                            const actual = _.sortBy(result, 'questionId');
                            expect(actual).to.deep.equal(expected);
                        })
                        .then(() => models.Answer.getOldAnswers({
                            userId: store.users[userIndex],
                            surveyId: store.surveys[surveyIndex]
                        }))
                        .then((actual) => {
                            const expectedAnswers = pullExpectedRemovedAnswers(key);
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
                                expect(actual[actualKeys[i]]).to.deep.equal(expectedAnswers[expectedKeys[i]]);
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
