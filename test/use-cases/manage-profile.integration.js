/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const helper = require('../util/survey-common');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const userExamples = require('../fixtures/example/user');
const surveyExamples = require('../fixtures/example/survey');

const config = require('../../config');

const expect = chai.expect;

describe('user set-up and login use-case', () => {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.alzheimer;

    // -------- set up system (syncAndLoadAlzheimer)

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest);

    before(shared.setUpFn());

    it('login as super user', shared.loginFn(config.superUser));

    it('create registry', shared.createSurveyProfileFn(surveyExample));

    it('logout as super user', shared.logoutFn());

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', function getProfileSurvey() {
        return rrSuperTest.get('/profile-survey', false, 200)
            .then((res) => {
                survey = res.body.survey;
            });
    });

    // --------- set up account

    let answers;

    it('fill user profile and submit', function fileeProfile() {
        answers = helper.formAnswersToPost(survey, surveyExamples.alzheimerAnswer);
        const user = userExample;
        return rrSuperTest.authPost('/profiles', { user, answers }, 201);
    });

    // -------- verification

    it('verify user profile', function verifyProfile() {
        return rrSuperTest.get('/profiles', true, 200)
            .then((res) => {
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expectedUser.createdAt = user.createdAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });

    // --------

    it('update user profile', function updateProfile() {
        answers = helper.formAnswersToPost(survey, surveyExamples.alzheimerReanswer);
        const userUpdates = {
            email: 'updated@example.com',
        };
        const user = userUpdates;
        return rrSuperTest.patch('/profiles', { user, answers }, 204)
            .send({
                user: userUpdates,
                answers,
            });
    });

    it('verify user profile', function verifyUserProfile() {
        return rrSuperTest.get('/profiles', true, 200)
            .then((res) => {
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                expectedUser.email = 'updated@example.com';
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expectedUser.createdAt = user.createdAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });
});
