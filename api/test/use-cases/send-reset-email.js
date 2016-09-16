/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const helper = require('../survey/survey-helper');

const shared = require('../shared.integration');
const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const config = require('../../config');

const expect = chai.expect;

describe('user set-up and login use-case', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    // -------- set up system (syncAndLoadAlzheimer)

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('login as super user', shared.loginFn(store, config.superUser));

    it('post example survey', function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .set('Authorization', store.auth)
            .send(surveyExample.survey)
            .expect(201)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(done);
    });

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', function (done) {
        store.server
            .get('/api/v1.0/surveys/empty/Alzheimer')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                survey = res.body;
                done();
            });
    });

    // --------- set up account

    var answers;
    var userId;

    it('fill user profile and submit', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        userExample.email = config.resetPw.emailFrom; // send to self

        store.server
            .post('/api/v1.0/registries/user-profile')
            .send({
                user: userExample,
                surveyId: survey.id,
                answers
            })
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const result = res.body;
                userId = result.id;
                done();
            });
    });

    // --------- login

    it('generate reset tokens', function (done) {
        store.server
            .post('/api/v1.0/reset-tokens')
            .send({
                email: userExample.email
            })
            .expect(201)
            .end(function (err, res) {
                done();
            });
    });
});
