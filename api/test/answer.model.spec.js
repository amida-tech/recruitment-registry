/* global describe,before,it*/
'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec');
const History = require('./util/entity-history');
const jsutil = require('../lib/jsutil');
const answerCommon = require('./util/answer-common');

const expect = chai.expect;
const shared = new SharedSpec();

describe('answer unit', function () {
    const hxAnswers = {};
    const hxUser = new History();
    const hxQuestion = new History();
    const hxSurvey = new History();

    const generateQxAnswer = _.partial(answerCommon.generateQxAnswer, hxQuestion);

    before(shared.setUpFn());

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUser(hxUser));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, shared.createQuestion(hxQuestion));
    }

    const testQuestions = answerCommon.testQuestions;

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, shared.createSurvey(hxSurvey, hxQuestion, surveyQuestion));
    });

    const createTestFn = function (userIndex, surveyIndex, seqIndex, stepIndex) {
        return function () {
            const qxIndices = testQuestions[surveyIndex].answerSequences[seqIndex][stepIndex];
            const key = `${userIndex}_${surveyIndex}_${seqIndex}`;
            const answers = qxIndices.map(generateQxAnswer);
            answerCommon.updateHxAnswers(hxAnswers, key, qxIndices, answers);
            const input = {
                userId: hxUser.id(userIndex),
                surveyId: hxSurvey.id(surveyIndex),
                answers
            };
            return models.Answer.createAnswers(input)
                .then(function () {
                    return models.Answer.getAnswers({
                            userId: hxUser.id(userIndex),
                            surveyId: hxSurvey.id(surveyIndex)
                        })
                        .then(function (result) {
                            const modifiedAnswers = answerCommon.prepareClientAnswers(answers);
                            const expected = _.sortBy(modifiedAnswers, 'questionId');
                            const actual = _.sortBy(result, 'questionId');
                            expect(actual).to.deep.equal(expected);
                        });
                });
        };
    };

    const pullExpectedAnswers = answerCommon.pullExpectedAnswers;

    const pullExpectedRemovedAnswers = function (key) {
        const answersSpec = hxAnswers[key];
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
            answerCommon.updateHxAnswers(hxAnswers, key, qxIndices, answers);
            const input = {
                userId: hxUser.id(userIndex),
                surveyId: hxSurvey.id(surveyIndex),
                answers
            };
            return models.Answer.createAnswers(input)
                .then(function () {
                    return models.Answer.getAnswers({
                            userId: hxUser.id(userIndex),
                            surveyId: hxSurvey.id(surveyIndex)
                        })
                        .then(function (result) {
                            const expectedAnswers = pullExpectedAnswers(hxAnswers, key);
                            const modifiedAnswers = answerCommon.prepareClientAnswers(expectedAnswers);
                            const expected = _.sortBy(modifiedAnswers, 'questionId');
                            const actual = _.sortBy(result, 'questionId');
                            expect(actual).to.deep.equal(expected);
                        })
                        .then(() => models.Answer.getOldAnswers({
                            userId: hxUser.id(userIndex),
                            surveyId: hxSurvey.id(surveyIndex)
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
                                const modifiedAnswers = answerCommon.prepareClientAnswers(expectedAnswers[expectedKeys[i]]);
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
