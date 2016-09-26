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

    const createTestFn = function (userIndex, surveyIndex, qxIndices, key) {
        return function () {
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

    it('user 0 answers survey 0 1st time', createTestFn(0, 0, testQuestions[0].answerSequences[0][0], 'a'));
    it('user 1 answers survey 1 1st time', createTestFn(1, 1, testQuestions[1].answerSequences[0][0], 'b'));
    it('user 2 answers survey 2 1st time', createTestFn(2, 2, testQuestions[2].answerSequences[0][0], 'c'));
    it('user 3 answers survey 3 1st time', createTestFn(3, 3, testQuestions[3].answerSequences[0][0], 'd'));
    it('user 2 answers survey 4 1st time', createTestFn(2, 4, testQuestions[4].answerSequences[0][0], 'e'));
    it('user 0 answers survey 3 1st time', createTestFn(0, 3, testQuestions[3].answerSequences[1][0], 'f'));

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

    const updateTestFn = function (userIndex, surveyIndex, qxIndices, key) {
        return function () {
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

    it('user 0 answers survey 0 2nd time', updateTestFn(0, 0, testQuestions[0].answerSequences[0][1], 'a'));
    it('user 1 answers survey 1 2nd time', updateTestFn(1, 1, testQuestions[1].answerSequences[0][1], 'b'));
    it('user 2 answers survey 2 2nd time', updateTestFn(2, 2, testQuestions[2].answerSequences[0][1], 'c'));
    it('user 3 answers survey 3 2nd time', updateTestFn(3, 3, testQuestions[3].answerSequences[0][1], 'd'));
    it('user 2 answers survey 4 2nd time', updateTestFn(2, 4, testQuestions[4].answerSequences[0][1], 'e'));
    it('user 0 answers survey 3 2nd time', updateTestFn(0, 3, testQuestions[3].answerSequences[1][1], 'f'));

    it('user 0 answers survey 0 3rd time', updateTestFn(0, 0, testQuestions[0].answerSequences[0][2], 'a'));
    it('user 1 answers survey 1 3rd time', updateTestFn(1, 1, testQuestions[1].answerSequences[0][2], 'b'));
    it('user 2 answers survey 2 3rd time', updateTestFn(2, 2, testQuestions[2].answerSequences[0][2], 'c'));
    it('user 3 answers survey 3 3rd time', updateTestFn(3, 3, testQuestions[3].answerSequences[0][2], 'd'));
    it('user 2 answers survey 4 3rd time', updateTestFn(2, 4, testQuestions[4].answerSequences[0][2], 'e'));
    it('user 0 answers survey 3 3rd time', updateTestFn(0, 3, testQuestions[3].answerSequences[1][2], 'f'));
});
