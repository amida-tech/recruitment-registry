/* global describe,before,it */

'use strict';

/* eslint max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');
const moment = require('moment');

const Generator = require('../util/generator');
const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const History = require('../util/history');
const SurveyHistory = require('../util/survey-history');
const surveyCommon = require('../util/survey-common');
const filterCommon = require('../util/filter-common');
const exampleSurveys = require('../fixtures/example/survey');
const config = require('../../config');

const expect = chai.expect;

describe('demographics', function ageCohort() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest);

    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const expectedDemographics = [];

    before(shared.setUpFn());

    it('login as super user', shared.loginFn(config.superUser));

    it('create profile survey', shared.createSurveyProfileFn(exampleSurveys.zipYOBProfileSurvey));

    it('logout as super user', shared.logoutFn());

    let birthYearId;
    let zipId;

    it('get profile survey', function getProfileSurvey() {
        return rrSuperTest.get('/profile-survey', false, 200)
            .then((res) => {
                const profileSurvey = res.body.survey;
                [zipId, birthYearId] = _.map(profileSurvey.questions, 'id');
            });
    });

    _.range(20).forEach((index) => {
        it(`register user ${index}`, function registerUser() {
            const user = generator.newUser();
            const birthYear = (2020 - 90) + (index * 2);
            const zipAnswer = `${20850 + index}`;
            const answers = [{
                questionId: birthYearId,
                answer: { yearValue: `${birthYear}` },
            }, {
                questionId: zipId,
                answer: { textValue: zipAnswer },
            }];
            return rrSuperTest.authPost('/profiles', { user, answers }, 201)
                .then((res) => {
                    return rrSuperTest.get('/profiles', false, 200)
                        .then((res) => {
                            const userInfo = res.body.user;
                            expectedDemographics.push({
                                zip: zipAnswer,
                                yob: `${birthYear}`,
                                registrationDate: moment(userInfo.createdAt,'YYYY-MM-DD').format('YYYY-MM-DD'),
                            });
                        });
                });
        });
        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('login as super user', shared.loginFn(config.superUser));

    it('get demographics', function getDemographics() {
        return rrSuperTest.get('/demographics', false, 200)
            .then((res) => {
                const demographics = res.body;
                expect(demographics).to.deep.equal(expectedDemographics);
            });
    });

    it('logout as super user', shared.logoutFn());
});
