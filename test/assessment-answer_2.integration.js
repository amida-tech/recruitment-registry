/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const questionCommon = require('./util/question-common');
const surveyCommon = require('./util/survey-common');
const assessmentCommon = require('./util/assessment-common');
const assessmentAnswerCommon = require('./util/assessment-answer-common');

describe('assessment answer status integration', function assessmentAnswerUnit() {
    const userCount = 3;
    const assessmentCount = 6;
    const questionCount = 8;

    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxAssessment = new History(['id', 'name', 'stage', 'group']);

    const questionTests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxQuestion);
    const assessmentTests = new assessmentCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxAssessment);
    const tests = new assessmentAnswerCommon.IntegrationTests(rrSuperTest, {
        generator, shared, hxUser, hxSurvey, hxQuestion, hxAssessment,
    });

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(userCount).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(questionCount).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 0', surveyTests.createSurveyFn({ noSection: true }));
    it('get survey 0', surveyTests.getSurveyFn(0));

    _.range(assessmentCount).forEach((index) => {
        const override = index < 2 ? { group: 'group' } : undefined;
        it(`create assessment ${index}`, assessmentTests.createAssessmentFn([0], override));
    });

    it('logout as super', shared.logoutFn());

    _.range(3).forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(hxUser, index));
        it(`verify assessment answer ${index} status`, tests.verifyStatusFn(index, index, 'new'));
        it(`verify assessment answer ${3 + index} status`, tests.verifyStatusFn(index, 3 + index, 'new'));
        it(`logout as  user ${index}`, shared.logoutFn());
    });

    it('login as super', shared.loginFn(config.superUser));

    it('verify assessment answers list', tests.verifyAssessmentAnswersListFn(['new', 'new', 'new', 'new', 'new', 'new']));
    it('verify assessment answers list (group)', tests.verifyAssessmentAnswersListFn(['new', 'new', 'new', 'new', 'new', 'new'], 'group', [0, 1]));

    _.range(3).forEach((index) => {
        it(`verify assessment answer ${index}`, tests.verifyAssessmentAnswersFn(index, index, 'new'));
        it(`verify assessment answer ${3 + index}`, tests.verifyAssessmentAnswersFn(index, 3 + index, 'new'));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 creates assessment 0 (completed)', tests.createAssessmentAnswersFullFn(0, 0, 'completed'));
    it('verify assessment 0 status', tests.verifyStatusFn(0, 0, 'completed'));
    it('verify assessment 0 answers', tests.verifyAssessmentAnswersFn(0, 0, 'completed'));

    it('verify assessment answers list', tests.verifyAssessmentAnswersListFn(['completed', 'new', 'new', 'new', 'new', 'new']));
    it('verify assessment answers list (group)', tests.verifyAssessmentAnswersListFn(['completed', 'new', 'new', 'new', 'new', 'new'], 'group', [0, 1]));
    it('logout as user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 creates assessment 1 (in progress)', tests.createAssessmentAnswersFullFn(1, 1, 'in-progress'));
    it('verify assessment 1 status', tests.verifyStatusFn(1, 1, 'in-progress'));
    it('verify assessment 1 answers', tests.verifyAssessmentAnswersFn(1, 1, 'in-progress'));

    it('verify assessment answers list', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'new', 'new', 'new', 'new']));
    it('verify assessment answers list (group)', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'new', 'new', 'new', 'new'], 'group', [0, 1]));

    it('user 2 modifies assessment 1 (in-progress)', tests.createAssessmentAnswersFullFn(2, 1, 'in-progress'));
    it('verify assessment 1 status', tests.verifyStatusFn(1, 1, 'in-progress'));
    it('verify assessment 1 answers', tests.verifyAssessmentAnswersFn(1, 1, 'in-progress'));

    it('verify assessment answers list', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'new', 'new', 'new', 'new']));
    it('verify assessment answers list (group)', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'new', 'new', 'new', 'new'], 'group', [0, 1]));

    it('logout as user 1', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 1));
    it('user 2 creates assessment 2 (in-progress)', tests.createAssessmentAnswersPartialFn(2, 2));
    it('verify assessment 2 status', tests.verifyStatusFn(0, 1, 'in-progress'));
    it('verify assessment 2 answers', tests.verifyAssessmentAnswersFn(2, 2, 'in-progress'));

    it('verify assessment answers list', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'in-progress', 'new', 'new', 'new']));
    it('verify assessment answers list (group)', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'in-progress', 'new', 'new', 'new'], 'group', [0, 1]));

    it('logout as user 2', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: user 0 creates assessment 3 partial (completed)', tests.createAssessmentAnswersPartialCompletedFn(0, 3));
    it('verify assessment 3 status', tests.verifyStatusFn(0, 3, 'new'));
    it('verify assessment 3 status', tests.verifyAssessmentAnswersFn(0, 3, 'new'));

    it('verify assessment answers list', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'in-progress', 'new', 'new', 'new']));
    it('verify assessment answers list (group)', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'in-progress', 'new', 'new', 'new'], 'group', [0, 1]));

    it('logout as user 0', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 1));
    it('user 2 completes assessment 2 (completed)', tests.createAssessmentAnswersMissingPlusCompletedFn(2, 2));
    it('verify assessment 2 status', tests.verifyStatusFn(2, 2, 'completed'));
    it('verify assessment 2 status', tests.verifyAssessmentAnswersFn(2, 2, 'completed'));

    it('verify assessment answers list', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'completed', 'new', 'new', 'new']));
    it('verify assessment answers list (group)', tests.verifyAssessmentAnswersListFn(['completed', 'in-progress', 'completed', 'new', 'new', 'new'], 'group', [0, 1]));

    it('logout as user 2', shared.logoutFn());
});
