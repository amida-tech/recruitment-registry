/* global describe,before,it */

'use strict';

/* eslint max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const config = require('../config');
const RRSuperTest = require('./util/rr-super-test');
const SharedIntegration = require('./util/shared-integration.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const questionCommon = require('./util/question-common');
const surveyCommon = require('./util/survey-common');
const answerCommon = require('./util/answer-common');

const expect = chai.expect;

describe('scale type question integration', function scaleQuestionIntegration() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);

    before(shared.setUpFn());

    const hxQuestion = new History();
    const hxSurvey = new SurveyHistory();
    const hxUser = new History();

    const tests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxQuestion);
    const answerTests = new answerCommon.IntegrationTests(rrSuperTest, { generator, hxUser, hxSurvey, hxQuestion });

    const cases = [
        [null, 5],    // 0
        [5, null],    // 1
        [7, 81],      // 2
        [0.5, 1.45],  // 3
        [1.4, null],  // 4
        [null, 5.15], // 5
        [0, 5],       // 6
        [-5, 0],      // 7
        [0, null],    // 8
        [null, 0],    // 9
    ];

    it('login as super', shared.loginFn(config.superUser));

    cases.forEach(([min, max], index) => {
        const scaleLimits = {};
        if (min === 0 || min) {
            scaleLimits.min = min;
        }
        if (max === 0 || max) {
            scaleLimits.max = max;
        }
        const options = { type: 'scale', scaleLimits };
        it(`create question ${index}`, tests.createQuestionFn(options));
        it(`get question ${index}`, tests.getQuestionFn(index));
        it(`verify question ${index}`, tests.verifyQuestionFn(index));
    });

    const errorQuestion = generator.newQuestion({ type: 'scale', scaleLimits: { min: 3, max: 2 } });
    it('error: scale minimum is greater than maximum', function errorMinGtMax() {
        return rrSuperTest.post('/questions', errorQuestion, 400)
             .then(res => shared.verifyErrorMessage(res, 'questionScaleMinGTMax'));
    });

    it('list questions 2, 4, 5', function listIded() {
        const indices = [2, 4, 5];
        const ids = indices.map(i => hxQuestion.id(i));
        return models.question.listQuestions({ scope: 'complete', ids })
            .then((questions) => {
                const expected = hxQuestion.listServers(null, indices);
                expect(questions).to.deep.equal(expected);
            });
    });

    it('list all questions (complete)', tests.listQuestionsFn('complete'));

    it('list all questions (summary)', tests.listQuestionsFn('summary'));

    it('list all questions (default - summary)', tests.listQuestionsFn());

    it('create all scale survey',
        surveyTests.createSurveyQxHxFn(_.range(cases.length)));
    it('get all scale survey', surveyTests.getSurveyFn(0));

    const userCount = 2;
    _.range(userCount + 1).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 0', answerTests.answerSurveyFn(0, 0, _.range(cases.length)));
    it('user 0 gets answers to survey 0', answerTests.getAnswersFn(0, 0));
    it('logout as user 0', shared.logoutFn());

    const errorCases = [
        { qxIndex: 0, numberValue: 6 },
        { qxIndex: 1, numberValue: 4 },
        { qxIndex: 2, numberValue: 6 },
        { qxIndex: 2, numberValue: 100.0 },
        { qxIndex: 3, numberValue: 0 },
        { qxIndex: 3, numberValue: 4 },
        { qxIndex: 4, numberValue: 1.3 },
        { qxIndex: 5, numberValue: 6.5 },
        { qxIndex: 6, numberValue: -1 },
        { qxIndex: 6, numberValue: 10 },
        { qxIndex: 7, numberValue: -10.1 },
        { qxIndex: 7, numberValue: 1 },
        { qxIndex: 8, numberValue: -1 },
        { qxIndex: 9, numberValue: 5 },
    ];

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    errorCases.forEach(({ qxIndex, numberValue }, index) => {
        it(`error: answer out of scale case ${index}`, function errorOutOfLimits() {
            const answers = [{
                questionId: hxQuestion.id(qxIndex),
                answer: { numberValue },
            }];
            const surveyId = hxSurvey.id(0);
            const status = 'in-progress';
            return rrSuperTest.post(`/user-surveys/${surveyId}/answers`, { status, answers }, 400)
                .then(res => shared.verifyErrorMessage(res, 'answerOutOfScale', numberValue));
        });
    });
    it('logout as user 1', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    cases.forEach(([min, max], caseIndex) => {
        const scaleLimits = {};
        if (min === 0 || min) {
            scaleLimits.min = min;
        }
        if (max === 0 || max) {
            scaleLimits.max = max;
        }
        const index = cases.length + caseIndex;
        const options = { type: 'scale', scaleLimits, multi: true };
        it(`create question ${index}`, tests.createQuestionFn(options));
        it(`get question ${index}`, tests.getQuestionFn(index));
        it(`verify question ${index}`, tests.verifyQuestionFn(index));
    });

    const multiCases = _.range(cases.length).map(index => index + cases.length);
    it('create all multiple scale survey',
        surveyTests.createSurveyQxHxFn(multiCases));
    it('get all multiple scale survey', surveyTests.getSurveyFn(1));

    it('logout as super', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 1', answerTests.answerSurveyFn(1, 1, multiCases));
    it('user 1 gets answers to survey 1', answerTests.getAnswersFn(1, 1));
    it('logout as user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    const multiErrorCases = [
        { qxIndex: 0, numberValues: [3, 6], value: 6 },
        { qxIndex: 1, numberValues: [10, 11, 4], value: 4 },
        { qxIndex: 2, numberValues: [6], value: 6 },
        { qxIndex: 2, numberValues: [100.0], value: 100.0 },
        { qxIndex: 3, numberValues: [0], value: 0 },
        { qxIndex: 3, numberValues: [4], value: 4 },
        { qxIndex: 4, numberValues: [1.3], value: 1.3 },
        { qxIndex: 5, numberValues: [6.5], value: 6.5 },
        { qxIndex: 6, numberValues: [-1], value: -1 },
        { qxIndex: 6, numberValues: [10], value: 10 },
        { qxIndex: 7, numberValues: [-10.1], value: -10.1 },
        { qxIndex: 7, numberValues: [1], value: 1 },
        { qxIndex: 8, numberValues: [-1, 5, -4], value: -1 },
        { qxIndex: 9, numberValues: [5, -5], value: 5 },
    ];

    multiErrorCases.forEach(({ qxIndex, numberValues, value }, index) => {
        it(`error: answer out of multi scale case ${index}`, function errorOutOfLimits() {
            const answers = [{
                questionId: hxQuestion.id(qxIndex),
                answers: numberValues.map(numberValue => ({ numberValue })),
            }];
            const surveyId = hxSurvey.id(1);
            const status = 'in-progress';
            return rrSuperTest.post(`/user-surveys/${surveyId}/answers`, { status, answers }, 400)
                .then(res => shared.verifyErrorMessage(res, 'answerOutOfScale', value));
        });
    });

    it('logout as user 0', shared.logoutFn());
});
