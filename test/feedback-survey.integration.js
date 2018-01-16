/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const constNames = require('../models/const-names');
const config = require('../config');

const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const SharedIntegration = require('./util/shared-integration');
const surveyCommon = require('./util/survey-common');
const answerCommon = require('./util/answer-common');
const userSurveyCommon = require('./util/user-survey-common');
const feedbackSurveyCommon = require('./util/feedback-survey-common');

const runErrorCases = (tests, errorCode, type, cases) => {
    cases.forEach(([feedbackIndex, index]) => {
        const msgEnd = _.isNil(index) ? 'as default' : `for survey ${index}`;
        it(`error (${type}): set feedback survey ${feedbackIndex} ${msgEnd}`,
            tests.errorCreateFeedbackSurveyFn(feedbackIndex, index, errorCode));
    });
};

const verifyCase = (tests, index) => {
    it(`get feedback survey for survey ${index}`, tests.getFeedbackSurveyFn(index));

    it(`get feedback survey for survey ${index} (full)`, tests.getFeedbackSurveyFn(index, { full: true }));
};

describe('feedback survey integration', function feedbackSurveyiIntegration() {
    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const hxQuestion = new History();
    const generator = new Generator();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const userSurveyTests = new userSurveyCommon.IntegrationTests(rrSuperTest, {
        hxSurvey, hxUser,
    });
    const answerTests = new answerCommon.IntegrationTests(rrSuperTest, {
        generator, hxUser, hxSurvey, hxQuestion,
    });
    const tests = new feedbackSurveyCommon.IntegrationTests(rrSuperTest, hxSurvey);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(3).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(8).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn());
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    // surveys 8 to 15 are feedback surveys
    _.range(8, 16).forEach((index) => {
        const options = { type: constNames.feedbackSurveyType };
        it(`create feedback survey ${index}`, surveyTests.createSurveyFn(options));
        it(`get feedback survey ${index}`, surveyTests.getSurveyFn(index));
    });

    [6, 7, 14, 15].forEach((index) => {
        it(`delete survey ${index}`, surveyTests.deleteSurveyFn(index));
    });

    it('check no feedback surveys', tests.listFeedbackSurveysFn());

    runErrorCases(tests, 'feedbackSurveyNoDeletedDefault', 'deleted', [
        [14, null], [14, 0], [8, 6], [15, 6],
    ]);

    runErrorCases(tests, 'feedbackSurveyNoWrongType', 'wrong type', [
        [0, null], [0, 1], [0, 8], [8, 9],
    ]);

    it('logout as super', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('set feedback survey 8 as default', tests.createFeedbackSurveyFn(8));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('set feedback survey 9 for survey 1', tests.createFeedbackSurveyFn(9, 1));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    verifyCase(tests, 1);
    it('logout as user 1', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('set feedback survey 10 for survey 0', tests.createFeedbackSurveyFn(10, 0));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    verifyCase(tests, 0);
    it('logout as user 2', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('change to feedback survey 10 for survey 1', tests.createFeedbackSurveyFn(10, 1));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    verifyCase(tests, 1);
    it('logout as user 0', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('set feedback survey 10 for survey 2', tests.createFeedbackSurveyFn(10, 2));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    verifyCase(tests, 2);
    it('logout as user 1', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('delete feedback survey for 2', tests.deleteFeedbackSurveyFn(2));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    verifyCase(tests, 2);
    it('logout as user 2', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('delete feedback survey for 0', tests.deleteFeedbackSurveyFn(0));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    verifyCase(tests, 0);
    it('logout as user 0', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('delete default feedback survey', tests.deleteFeedbackSurveyFn());
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    verifyCase(tests, 3);
    it('logout as user 1', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('set feedback survey 11 as default', tests.createFeedbackSurveyFn(11));
    it('list feedback surveys', tests.listFeedbackSurveysFn());
    it('logout as super', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('verify user 2 user survey list', userSurveyTests.verifyUserSurveyListFn(2));
    it('logout as user 2', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    [10, 11].forEach((index) => {
        it(`error: delete feedback survey ${index}`,
            surveyTests.errorDeleteSurveyFn(index, 'surveyNoDeleteFeedback'));
    });

    it('set feedback survey 10 for survey 2', tests.createFeedbackSurveyFn(10, 2));

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    verifyCase(tests, 2);
    it('logout as user 0', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    [2, 13].forEach((index) => {
        it(`delete survey ${index}`, function deleteSurvey() {
            return surveyTests.deleteSurveyFn(index)()
                .then(() => tests.updateHistoryWhenSurveyDeleted(index));
        });
    });

    it('list feedback surveys', tests.listFeedbackSurveysFn());

    it('logout as super', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('verify user 1 user survey list', userSurveyTests.verifyUserSurveyListFn(1));
    it('logout as user 1', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    it('error: patch feedback survey 11 for type', surveyTests.errorPatchSurveyFn(11, {
        type: constNames.defaultSurveyType,
    }, { complete: true, errorKey: 'surveyNoPatchTypeWhenFeedback', statusCode: 400 }));

    it('error: patch survey 1 for type (feedback)', surveyTests.errorPatchSurveyFn(1, {
        type: constNames.feedbackSurveyType,
    }, { complete: true, errorKey: 'surveyNoPatchTypeWhenFeedback', statusCode: 400 }));

    it('logout as super', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 answers feedback survey 12', answerTests.answerSurveyFn(2, 12));
    it('logout as user 1', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    it('error: patch answered feedback survey 12 for type', surveyTests.errorPatchSurveyFn(12, {
        type: constNames.defaultSurveyType,
    }, { complete: true, errorKey: 'surveyNoPatchTypeWhenAnswer', statusCode: 400 }));

    it('patch feedback survey 5 for type', surveyTests.patchSurveyFn(5, {
        type: constNames.feedbackSurveyType,
    }, { complete: true }));

    it('logout as super', shared.logoutFn());
});
