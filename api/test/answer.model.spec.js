/* global describe,before,it*/
'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const answerCommon = require('./util/answer-common');
const questionCommon = require('./util/question-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('answer unit', function () {
    const testQuestions = answerCommon.testQuestions;

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();

    const tests = new answerCommon.SpecTests(generator, hxUser, hxSurvey, hxQuestion);
    const hxAnswers = tests.hxAnswer;

    const questionTests = new questionCommon.SpecTests(generator, hxQuestion);

    before(shared.setUpFn());

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, questionTests.createQuestionFn());
        it(`get question ${i}`, questionTests.getQuestionFn(i));
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
                    const expectedAnswers = hxAnswers.expectedRemovedAnswers(userIndex, surveyIndex);
                    const expectedKeys = _.sortBy(Object.keys(expectedAnswers), r => Number(r));
                    const actualKeys = _.sortBy(Object.keys(actual), r => Number(r));
                    expect(actualKeys.length).to.equal(expectedKeys.length);
                    for (let i = 0; i < expectedKeys.length; ++i) {
                        comparator.answers(expectedAnswers[expectedKeys[i]], actual[actualKeys[i]]);
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
        const questionIndices = testQuestions[surveyIndex].answerSequences[seqIndex][0];
        it(`user ${userIndex} answers survey ${surveyIndex} (step 0)`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
        it(`user ${userIndex} gets answers to survey ${surveyIndex} (step 0)`, tests.getAnswersFn(userIndex, surveyIndex));
    }

    for (let j = 1; j < 3; ++j) {
        for (let i = 0; i < cases.length; ++i) {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            const questionIndices = testQuestions[surveyIndex].answerSequences[seqIndex][j];
            it(`user ${userIndex} answers survey ${surveyIndex} (step ${j})`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
            it(`user ${userIndex} gets answers to survey ${surveyIndex} (step ${j})`, tests.getAnswersFn(userIndex, surveyIndex));
            it('list user ${userIndex} survey ${surveyIndex} answer history (step ${j})', listAnswersFn(userIndex, surveyIndex));
        }
    }

    it('create question 20 (choices of all types)', function () {
        const question = generator.questionGenerator.allChoices();
        return questionTests.createQuestionFn(question)();
    });
    it('get question 20', questionTests.getQuestionFn(20));
    it(`create survey ${testQuestions.length}`, createSurveyFn([20]));
    it('replace choices type answer generator to answer all choices', function () {
        const answerer = new answerCommon.AllChoicesAnswerer();
        answerer.answerIndex = tests.generator.answerer.answerIndex;
        tests.generator.answerer = answerer;
    });
    it(`user 3 answers survey 5`, tests.answerSurveyFn(3, 5, [20]));
    it(`user 3 gets answers to survey 5`, tests.getAnswersFn(3, 5));
});
