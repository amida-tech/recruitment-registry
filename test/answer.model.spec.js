/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const Answerer = require('./util/generator/answerer');
const comparator = require('./util/comparator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const answerCommon = require('./util/answer-common');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');
const surveyCommon = require('./util/survey-common');
const answerSession = require('./fixtures/answer-session/survey-0');

const expect = chai.expect;

describe('answer unit', () => {
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxChoiceSet = new History();

    const tests = new answerCommon.SpecTests({ generator, hxUser, hxSurvey, hxQuestion });
    const hxAnswers = tests.hxAnswer;

    const questionTests = new questionCommon.SpecTests({ generator, hxQuestion });
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);

    before(shared.setUpFn());

    const userCount = 3;
    _.range(userCount + 1).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    _.range(20).forEach((i) => {
        it(`create question ${i}`, questionTests.createQuestionFn());
        it(`get question ${i}`, questionTests.getQuestionFn(i));
    });

    const surveyOpts = { noneRequired: true };
    _.map(answerSession, 'survey').forEach((qxIndices, index) => {
        it(`create survey ${index}`, surveyTests.createSurveyQxHxFn(qxIndices, surveyOpts));
    });

    it('error: invalid answer property', () => {
        const input = {
            userId: hxUser.id(0),
            surveyId: hxSurvey.id(0),
            answers: [{
                questionId: hxQuestion.id(0),
                answer: {
                    invalidValue: 'invalidValue',
                },
            }],
        };
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerAnswerNotUnderstood', 'invalidValue'));
    });

    it('error: multiple answer properties', () => {
        const input = {
            userId: hxUser.id(0),
            surveyId: hxSurvey.id(0),
            answers: [{
                questionId: hxQuestion.id(0),
                answer: {
                    invalidValue1: 'invalidValue1',
                    invalidValue0: 'invalidValue0',
                },
            }],
        };
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerMultipleTypeAnswers', 'invalidValue0, invalidValue1'));
    });

    const listAnswersFn = function (userIndex, surveyIndex) {
        return function listAnswers() {
            return models.answer.listAnswers({
                userId: hxUser.id(userIndex),
                surveyId: hxSurvey.id(surveyIndex),
                scope: 'history-only',
                history: true,
            })
                .then((actual) => {
                    actual = _.groupBy(actual, 'deletedAt');
                    Object.keys(actual).forEach(key => actual[key].forEach(value => delete value.deletedAt));
                    const expectedAnswers = hxAnswers.expectedRemovedAnswers(userIndex, surveyIndex);
                    const expectedKeys = _.sortBy(Object.keys(expectedAnswers), r => Number(r));
                    const actualKeys = _.sortBy(Object.keys(actual), r => Number(r));
                    expect(actualKeys.length).to.equal(expectedKeys.length);
                    _.range(expectedKeys.length).forEach((i) => {
                        comparator.answers(expectedAnswers[expectedKeys[i]], actual[actualKeys[i]]);
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

    _.range(cases.length).forEach((i) => {
        const { userIndex, surveyIndex, seqIndex } = cases[i];
        const questionIndices = answerSession[surveyIndex].answerSequences[seqIndex][0];
        it(`user ${userIndex} answers survey ${surveyIndex} (step 0)`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
        it(`user ${userIndex} gets answers to survey ${surveyIndex} (step 0)`, tests.getAnswersFn(userIndex, surveyIndex));
    });

    _.range(3).forEach((j) => {
        _.range(cases.length).forEach((i) => {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            const questionIndices = answerSession[surveyIndex].answerSequences[seqIndex][j];
            it(`user ${userIndex} answers survey ${surveyIndex} (step ${j})`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
            it(`user ${userIndex} gets answers to survey ${surveyIndex} (step ${j})`, tests.getAnswersFn(userIndex, surveyIndex));
            it(`list user ${userIndex} survey ${surveyIndex} answer history (step ${j})`, listAnswersFn(userIndex, surveyIndex));
        });
    });

    [0, 1].forEach((index) => {
        it(`create question ${20 + index}`, questionTests.createQuestionFn());
        it(`get question ${20 + index}`, questionTests.getQuestionFn());
        it(`create survey ${answerSession.length + 1}`, surveyTests.createSurveyQxHxFn([20 + index], surveyOpts));
        it(`user 3 answers survey ${5 + index}`, tests.answerSurveyFn(3, 5 + index, [20 + index]));
        it(`user 3 gets answers to survey ${5 + index}`, tests.getAnswersFn(3, 5 + index));
    });

    _.range(22, 34).forEach((index) => {
        const options = { multi: true };
        it(`create question ${index} (multi)`, questionTests.createQuestionFn(options));
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });
    _.range(34, 52).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 7 (1 multi)', surveyTests.createSurveyQxHxFn([22, 34, 35, 36], surveyOpts));
    it('create survey 8 (2 multi)', surveyTests.createSurveyQxHxFn([37, 23, 38, 39, 24], surveyOpts));
    it('create survey 9 (3 multi)', surveyTests.createSurveyQxHxFn([25, 40, 41, 42, 26, 27], surveyOpts));
    it('create survey 10 (1 multi)', surveyTests.createSurveyQxHxFn([43, 44, 28, 45], surveyOpts));
    it('create survey 11 (2 multi)', surveyTests.createSurveyQxHxFn([46, 29, 30, 47, 48], surveyOpts));
    it('create survey 12 (3 multi)', surveyTests.createSurveyQxHxFn([31, 49, 32, 50, 33, 51], surveyOpts));

    it('switch back to generic answerer', () => {
        generator.updateAnswererClass(Answerer);
    });

    it('user 3 answers survey 7', tests.answerSurveyFn(3, 7, [22, 34, 35, 36]));
    it('user 3 gets answers to survey 7', tests.getAnswersFn(3, 7));
    it('user 2 answers survey 8', tests.answerSurveyFn(2, 8, [37, 23, 38, 39, 24]));
    it('user 2 gets answers to survey 8', tests.getAnswersFn(2, 8));
    it('user 1 answers survey 9', tests.answerSurveyFn(1, 9, [25, 40, 41, 42, 26, 27]));
    it('user 1 gets answers to survey 9', tests.getAnswersFn(1, 9));
    it('user 0 answers survey 10', tests.answerSurveyFn(0, 10, [43, 44, 28, 45]));
    it('user 0 gets answers to survey 10', tests.getAnswersFn(0, 10));
    it('user 1 answers survey 11', tests.answerSurveyFn(1, 11, [46, 29, 30, 47, 48]));
    it('user 1 gets answers to survey 11', tests.getAnswersFn(1, 11));
    it('user 2 answers survey 12', tests.answerSurveyFn(2, 12, [31, 49, 32, 50, 33, 51]));
    it('user 2 gets answers to survey 12', tests.getAnswersFn(2, 12));

    _.range(8).forEach((index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(8).map(index => hxChoiceSet.server(index));
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(generator.questionGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(52, 62).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 13 (5 choice sets)', surveyTests.createSurveyQxHxFn([52, 53, 54, 55, 56], surveyOpts));
    it('create survey 14 (5 choice sets)', surveyTests.createSurveyQxHxFn([57, 58, 59, 60, 61], surveyOpts));

    it('user 3 answers survey 13', tests.answerSurveyFn(3, 13, [52, 53, 54, 55, 56]));
    it('user 3 gets answers to survey 13', tests.getAnswersFn(3, 13));
    it('user 2 answers survey 14', tests.answerSurveyFn(2, 14, [57, 58, 59, 60, 61]));
    it('user 2 gets answers to survey 14', tests.getAnswersFn(2, 14));
});
