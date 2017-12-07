/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const RRSuperTest = require('./util/rr-super-test');
const SharedIntegration = require('./util/shared-integration');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const MultiIndexHistory = require('./util/multi-index-history');
const surveyCommon = require('./util/survey-common');
const assessmentCommon = require('./util/assessment-common');
const answerCommon = require('./util/answer-common');

const expect = chai.expect;

const generator = new Generator();

describe('user assessment integration', () => {
    const surveyCount = 6;
    const assessmentCount = 2;

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxAssessment = new History(['id', 'name']);
    const hxUserAssessment = new MultiIndexHistory();

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const assessmentTests = new assessmentCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxAssessment);
    const opt = { generator, hxUser, hxSurvey };
    const answerTests = new answerCommon.IntegrationTests(rrSuperTest, opt);
    const hxAnswer = answerTests.hxAnswer;

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(2).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(surveyCount).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    _.range(assessmentCount).forEach((index) => {
        const indices = _.range(index * 3, (index + 1) * 3);
        it(`create assessment ${index}`, assessmentTests.createAssessmentFn(indices));
        it(`get assessment ${index}`, assessmentTests.getAssessmentFn(index));
    });

    const openUserAssessmentFn = function (userIndex, assessmentIndex, timeIndex) {
        return function openUserAssessment(done) {
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const userAssessment = { userId, assessmentId };
            rrSuperTest.post('/user-assessments', userAssessment, 201)
                .expect((res) => {
                    hxUserAssessment.pushWithId([userIndex, assessmentIndex, timeIndex], userAssessment, res.body.id);
                })
                .end(done);
        };
    };

    const closeUserAssessmentFn = function (userIndex, assessmentIndex) {
        return function closeUserAssessment(done) {
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const query = { 'user-id': userId, 'assessment-id': assessmentId };
            rrSuperTest.delete('/user-assessments', 204, query).end(done);
        };
    };

    it('open user 0 assessment 0 (0)', openUserAssessmentFn(0, 0, 0));
    it('open user 1 assessment 1 (0)', openUserAssessmentFn(1, 1, 0));
    it('logout as super', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    _.range(0, 3).forEach((index) => {
        it(`user 0 answers survey ${index}`, answerTests.answerSurveyFn(0, index));
    });
    it('logout as  user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    _.range(3, 6).forEach((index) => {
        it(`user 1 answers survey ${index}`, answerTests.answerSurveyFn(1, index));
    });
    it('logout as  user 1', shared.logoutFn());
    it('login as super', shared.loginFn(config.superUser));
    it('open user 0 assessment 0 (1)', openUserAssessmentFn(0, 0, 1));
    it('open user 1 assessment 1 (1)', openUserAssessmentFn(1, 1, 1));
    it('logout as super', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    _.range(0, 3).forEach((index) => {
        it(`user 0 answers survey ${index}`, answerTests.answerSurveyFn(0, index));
    });
    it('logout as  user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    _.range(3, 6).forEach((index) => {
        it(`user 1 answers survey ${index}`, answerTests.answerSurveyFn(1, index));
    });
    it('logout as  user 1', shared.logoutFn());
    it('login as super', shared.loginFn(config.superUser));
    it('close user 0 assessment 0', closeUserAssessmentFn(0, 0));
    it('close user 1 assessment 1', closeUserAssessmentFn(1, 1));
    it('open user 0 assessment 0 (2)', openUserAssessmentFn(0, 0, 2));
    it('open user 1 assessment 1 (2)', openUserAssessmentFn(1, 1, 2));
    it('logout as super', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    _.range(0, 3).forEach((index) => {
        it(`user 0 answers survey ${index}`, answerTests.answerSurveyFn(0, index));
    });
    it('logout as  user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    _.range(3, 6).forEach((index) => {
        it(`user 1 answers survey ${index}`, answerTests.answerSurveyFn(1, index));
    });
    it('logout as  user 1', shared.logoutFn());
    it('login as super', shared.loginFn(config.superUser));
    it('close user 0 assessment 0', closeUserAssessmentFn(0, 0));
    it('close user 1 assessment 1', closeUserAssessmentFn(1, 1));

    const answersForUser = [null, null];

    it('transfer expected answers', () => {
        answersForUser[0] = hxAnswer.listFlatForUser(0);
        answersForUser[1] = hxAnswer.listFlatForUser(1);
    });

    const listUserAssessmentsFn = function (userIndex, assessmentIndex) {
        return function listUserAssessments(done) {
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const query = { 'user-id': userId, 'assessment-id': assessmentId };
            rrSuperTest.get('/user-assessments', true, 200, query)
                .expect((res) => {
                    const expected = _.range(3).map((index) => {
                        const id = hxUserAssessment.id([userIndex, assessmentIndex, index]);
                        return Object.assign({ version: index }, { id });
                    });
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const listUserAssessmentAnswersFn = function (userIndex, assessmentIndex, timeIndex) {
        return function listUserAssessmentAnswers(done) {
            const id = hxUserAssessment.id([userIndex, assessmentIndex, timeIndex]);
            const [minSurveyIndex, maxSurveyIndex] = assessmentIndex === 0 ? [0, 2] : [3, 5];
            const surveyTimeIndices = _.range(minSurveyIndex, maxSurveyIndex + 1).reduce((r, surveyIndex) => {
                r[surveyIndex] = 0;
                return r;
            }, {});
            rrSuperTest.get(`/user-assessments/${id}/answers`, true, 200)
                .expect((res) => {
                    const expected = hxAnswer.store.reduce((r, record) => {
                        if (record.userIndex !== userIndex) {
                            return r;
                        }
                        const surveyTimeIndex = surveyTimeIndices[record.surveyIndex];
                        surveyTimeIndices[record.surveyIndex] = surveyTimeIndex + 1;
                        const surveyIndex = record.surveyIndex;
                        let answers = record.answers;
                        if (surveyIndex >= minSurveyIndex && surveyIndex <= maxSurveyIndex && timeIndex === surveyTimeIndex) {
                            const surveyId = hxSurvey.id(surveyIndex);
                            answers = answers.map(answer => Object.assign({ surveyId }, answer));
                            r.push(...answers);
                        }
                        return r;
                    }, []);
                    comparator.answers(expected, res.body);
                })
                .end(done);
        };
    };

    it('list user 0 assessment 0 instances', listUserAssessmentsFn(0, 0));
    it('list user 1 assessment 1 instances', listUserAssessmentsFn(1, 1));

    it('list user 0 assessment 0 (0) answers', listUserAssessmentAnswersFn(0, 0, 0));
    it('list user 0 assessment 0 (1) answers', listUserAssessmentAnswersFn(0, 0, 1));
    it('list user 0 assessment 0 (2) answers', listUserAssessmentAnswersFn(0, 0, 2));
    it('list user 1 assessment 1 (0) answers', listUserAssessmentAnswersFn(1, 1, 0));
    it('list user 1 assessment 1 (1) answers', listUserAssessmentAnswersFn(1, 1, 1));
    it('list user 1 assessment 1 (2) answers', listUserAssessmentAnswersFn(1, 1, 2));

    it('logout as super', shared.logoutFn());

    shared.verifyUserAudit();
});
