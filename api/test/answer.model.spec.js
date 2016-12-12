/* global describe,before,it*/
'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const AnswerHistory = require('./util/answer-history');
const answerCommon = require('./util/answer-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('answer unit', function () {
    const testQuestions = answerCommon.testQuestions;
    const hxAnswer = new AnswerHistory();

    const hxUser = hxAnswer.hxUser;
    const hxQuestion = hxAnswer.hxQuestion;
    const hxSurvey = hxAnswer.hxSurvey;

    before(shared.setUpFn());

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, shared.createQuestion(hxQuestion));
    }

    const createSurveyFn = function (qxIndices) {
        return function () {
            const inputSurvey = generator.newSurvey();
            inputSurvey.questions = qxIndices.map(index => ({
                id: hxQuestion.server(index).id,
                required: false
            }));
            return models.survey.createSurvey(inputSurvey)
                .then(id => {
                    hxSurvey.push(inputSurvey, { id });
                });
        };
    };

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, createSurveyFn(surveyQuestion));
    });

    it('error: invalid answer property', function () {
        const input = {
            userId: hxUser.id(0),
            surveyId: hxSurvey.id(0),
            answers: [{
                questionId: hxQuestion.id(0),
                answer: {
                    invalidValue: 'invalidValue'
                }
            }]
        };
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerAnswerNotUnderstood', 'invalidValue'));
    });

    it('error: multiple answer properties', function () {
        const input = {
            userId: hxUser.id(0),
            surveyId: hxSurvey.id(0),
            answers: [{
                questionId: hxQuestion.id(0),
                answer: {
                    invalidValue1: 'invalidValue1',
                    invalidValue0: 'invalidValue0'
                }
            }]
        };
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerMultipleTypeAnswers', 'invalidValue0, invalidValue1'));
    });

    const createAnswersFn = function (userIndex, surveyIndex, seqIndex, stepIndex) {
        return function () {
            const qxIndices = testQuestions[surveyIndex].answerSequences[seqIndex][stepIndex];
            const { answers, language } = hxAnswer.generateAnswers(userIndex, surveyIndex, qxIndices);
            const input = {
                userId: hxUser.id(userIndex),
                surveyId: hxSurvey.id(surveyIndex),
                answers
            };
            if (language) {
                input.language = language;
            }
            return models.answer.createAnswers(input);
        };
    };

    const getAnswersFn = function (userIndex, surveyIndex) {
        return function () {
            return models.answer.getAnswers({
                    userId: hxUser.id(userIndex),
                    surveyId: hxSurvey.id(surveyIndex)
                })
                .then(function (result) {
                    const expected = hxAnswer.expectedAnswers(userIndex, surveyIndex);
                    const actual = _.sortBy(result, 'questionId');
                    expect(actual).to.deep.equal(expected);
                });
        };
    };

    const listAnswersFn = function (userIndex, surveyIndex) {
        return function () {
            return models.answer.listAnswers({
                    userId: hxUser.id(userIndex),
                    surveyId: hxSurvey.id(surveyIndex),
                    scope: 'history-only',
                    history: true
                })
                .then((actual) => {
                    actual = _.groupBy(actual, 'deletedAt');
                    Object.keys(actual).forEach(key => actual[key].forEach(value => delete value.deletedAt));

                    const expectedAnswers = hxAnswer.expectedRemovedAnswers(userIndex, surveyIndex);
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
                        const sortedActual = _.sortBy(actual[actualKeys[i]], 'questionId');
                        expect(sortedActual).to.deep.equal(modifiedAnswers);
                    }
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
        it(`user ${userIndex} answers survey ${surveyIndex} (step 0)`, createAnswersFn(userIndex, surveyIndex, seqIndex, 0));
        it(`user ${userIndex} gets answers to survey ${surveyIndex} (step 0)`, getAnswersFn(userIndex, surveyIndex));
    }

    for (let j = 1; j < 3; ++j) {
        for (let i = 0; i < cases.length; ++i) {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            it(`user ${userIndex} answers survey ${surveyIndex} (step ${j})`, createAnswersFn(userIndex, surveyIndex, seqIndex, j));
            it(`user ${userIndex} gets answers to survey ${surveyIndex} (step ${j})`, getAnswersFn(userIndex, surveyIndex));
            it('list user ${userIndex} survey ${surveyIndex} answer history (step ${j})', listAnswersFn(userIndex, surveyIndex));
        }
    }
});
