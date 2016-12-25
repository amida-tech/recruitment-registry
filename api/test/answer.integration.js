/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const answerCommon = require('./util/answer-common');
const questionCommon = require('./util/question-common');

describe('answer integration', function () {
    const generator = new Generator();
    const shared = new SharedIntegration(generator);

    const store = new RRSuperTest();

    const testQuestions = answerCommon.testQuestions;

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();

    const tests = new answerCommon.IntegrationTests(store, generator, hxUser, hxSurvey, hxQuestion);

    const questionTests = new questionCommon.IntegrationTests(store, generator, hxQuestion);

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(store, hxUser));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, questionTests.createQuestionFn());
        it(`get question ${i}`, questionTests.getQuestionFn(i));
    }

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, shared.createSurveyFn(store, hxSurvey, hxQuestion, surveyQuestion));
    });

    it('logout as super', shared.logoutFn(store));

    const cases = [
        { userIndex: 0, surveyIndex: 0, seqIndex: 0 },
        { userIndex: 1, surveyIndex: 1, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 2, seqIndex: 0 },
        { userIndex: 3, surveyIndex: 3, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 4, seqIndex: 0 },
        { userIndex: 0, surveyIndex: 3, seqIndex: 1 },
    ];

    for (let j = 0; j < 3; ++j) {
        for (let i = 0; i < cases.length; ++i) {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            const questionIndices = testQuestions[surveyIndex].answerSequences[seqIndex][j];
            it(`login as user ${userIndex}`, shared.loginIndexFn(store, hxUser, userIndex));
            it(`user ${userIndex} answers survey ${surveyIndex} (step ${j})`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
            it(`user ${userIndex} gets answers to survey ${surveyIndex} (step ${j})`, tests.getAnswersFn(userIndex, surveyIndex));
            it(`logout as  user ${userIndex}`, shared.logoutFn(store));
        }
    }

    it('login as super', shared.loginFn(store, config.superUser));
    it('create question 20 (choices of all types)', function (done) {
        const question = generator.questionGenerator.allChoices();
        return questionTests.createQuestionFn(question)(done);
    });
    it('get question 20', questionTests.getQuestionFn(20));
    it(`create survey ${testQuestions.length}`, shared.createSurveyFn(store, hxSurvey, hxQuestion, [20]));
    it('replace choices type answer generator to answer all choices', function () {
        const answerer = new answerCommon.AllChoicesAnswerer();
        answerer.answerIndex = tests.generator.answerer.answerIndex;
        tests.generator.answerer = answerer;
    });
    it('logout as super', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`user 3 answers survey 5`, tests.answerSurveyFn(3, 5, [20]));
    it(`user 3 gets answers to survey 5`, tests.getAnswersFn(3, 5));
    it(`logout as  user 3`, shared.logoutFn(store));
});
