/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const constNames = require('../models/const-names');

const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const SharedSpec = require('./util/shared-spec');
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
    const msgEnd = _.isNil(index) ? 'as default' : `for survey ${index}`;

    it(`get feedback survey ${msgEnd}`, tests.getFeedbackSurveyFn(index));

    it(`get feedback survey ${msgEnd} (full)`, tests.getFeedbackSurveyFn(index, { full: true }));

    it('list feedback surveys', tests.listFeedbackSurveysFn());
};

describe('feedback survey unit', function feedbackSurveyUnit() {
    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const hxQuestion = new History();
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);
    const userSurveyTests = new userSurveyCommon.SpecTests({ hxSurvey, hxUser });
    const answerTests = new answerCommon.SpecTests({ generator, hxUser, hxSurvey, hxQuestion });
    const tests = new feedbackSurveyCommon.SpecTests(hxSurvey);

    before(shared.setUpFn());

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

    it('set feedback survey 8 as default', tests.createFeedbackSurveyFn(8));

    verifyCase(tests);

    it('set feedback survey 9 for survey 1', tests.createFeedbackSurveyFn(9, 1));

    verifyCase(tests, 1);

    it('set feedback survey 10 for survey 0', tests.createFeedbackSurveyFn(10, 0));

    verifyCase(tests, 0);

    it('change to feedback survey 10 for survey 1', tests.createFeedbackSurveyFn(10, 1));

    verifyCase(tests, 1);

    it('set feedback survey 10 for survey 2', tests.createFeedbackSurveyFn(10, 2));

    verifyCase(tests, 2);

    it('delete feedback survey for 2', tests.deleteFeedbackSurveyFn(2));

    verifyCase(tests, 2);

    it('delete feedback survey for 0', tests.deleteFeedbackSurveyFn(0));

    verifyCase(tests, 0);

    it('delete default feedback survey', tests.deleteFeedbackSurveyFn());

    verifyCase(tests, 3);

    it('set feedback survey 11 as default', tests.createFeedbackSurveyFn(11));

    verifyCase(tests);

    it('verify user 0 user survey list', userSurveyTests.verifyUserSurveyListFn(0));

    [10, 11].forEach((index) => {
        it(`error: delete feedback survey ${index}`,
            surveyTests.errorDeleteSurveyFn(index, 'surveyNoDeleteFeedback'));
    });

    it('set feedback survey 10 for survey 2', tests.createFeedbackSurveyFn(10, 2));

    verifyCase(tests, 2);

    [2, 13].forEach((index) => {
        it(`delete survey ${index}`, function deleteSurvey() {
            return surveyTests.deleteSurveyFn(index)()
                .then(() => tests.updateHistoryWhenSurveyDeleted(index));
        });
    });

    it('list feedback surveys', tests.listFeedbackSurveysFn());

    it('verify user 1 user survey list', userSurveyTests.verifyUserSurveyListFn(1));

    it('error: patch feedback survey 11 for type', surveyTests.errorPatchSurveyFn(11, {
        type: constNames.defaultSurveyType,
    }, { complete: true, errorKey: 'surveyNoPatchTypeWhenFeedback' }));

    it('error: patch survey 1 for type (feedback)', surveyTests.errorPatchSurveyFn(1, {
        type: constNames.feedbackSurveyType,
    }, { complete: true, errorKey: 'surveyNoPatchTypeWhenFeedback' }));

    it('user 2 answers feedback survey 12', answerTests.answerSurveyFn(2, 12));

    it('error: patch answered feedback survey 12 for type', surveyTests.errorPatchSurveyFn(12, {
        type: constNames.defaultSurveyType,
    }, { complete: true, errorKey: 'surveyNoPatchTypeWhenAnswer' }));

    it('patch feedback survey 5 for type', surveyTests.patchSurveyFn(5, {
        type: constNames.feedbackSurveyType,
    }, { complete: true }));
});
