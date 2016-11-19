/* global describe,before,it*/
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
const shared = new SharedIntegration();

describe('user set-up and login use-case', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    // -------- set up system (syncAndLoadAlzheimer)

    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    it('login as super user', shared.loginFn(store, config.superUser));

    it('create registry', shared.createSurveyProfileFn(store, surveyExample.survey));

    it('logout as super user', shared.logoutFn(store));

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', function (done) {
        store.server
            .get('/api/v1.0/profile-survey')
            .expect(200)
            .expect(function (res) {
                survey = res.body.survey;
            })
            .end(done);
    });

    // --------- set up account

    let answers;

    it('fill user profile and submit', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        store.server
            .post('/api/v1.0/profiles')
            .send({
                user: userExample,
                answers
            })
            .expect(201)
            .expect(function (res) {
                shared.updateStoreFromCookie(store, res);
            })
            .end(done);
    });

    // -------- verification

    it('verify user profile', function (done) {
        store.server
            .get('/api/v1.0/profiles')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

            })
            .end(done);
    });

    // --------

    it('update user profile', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answerUpdate);
        const userUpdates = {
            email: 'updated@example.com'
        };
        store.server
            .patch('/api/v1.0/profiles')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .send({
                user: userUpdates,
                answers
            })
            .expect(204)
            .end(done);
    });

    it('verify user profile', function (done) {
        store.server
            .get('/api/v1.0/profiles')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                expectedUser.email = 'updated@example.com';
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

            })
            .end(done);
    });
});
