/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const helper = require('../helper/survey-helper');

const shared = require('../util/shared-integration');
const userExamples = require('../fixtures/example/user');
const surveyExamples = require('../fixtures/example/survey');

const config = require('../../config');

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

    it('create registry', shared.postSurveyFn(store, surveyExample.survey));

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', function (done) {
        store.server
            .get('/api/v1.0/surveys/name/Alzheimer')
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

    let answers;
    let userId;

    it('fill user profile and submit', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        userExample.email = config.resetPw.emailFrom; // send to self

        store.server
            .post('/api/v1.0/profiles')
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
            .end(function () {
                done();
            });
    });
});
