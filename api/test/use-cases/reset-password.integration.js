/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');

const helper = require('../helper/survey-helper');

const SharedIntegration = require('../util/shared-integration');
const userExamples = require('../fixtures/example/user');
const surveyExamples = require('../fixtures/example/survey');

const config = require('../../config');
const mailer = require('../../lib/mailer');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('reset password use-case', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    // -------- set up system (syncAndLoadAlzheimer)

    const store = {
        server: null,
        auth: null
    };

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

    it('fill user profile and submit', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        store.server
            .post('/api/v1.0/profiles')
            .send({
                user: userExample,
                answers
            })
            .expect(201, done);
    });

    // --------- login

    it('verify user can login', shared.loginFn(store, userExample));

    let token;

    it('generate reset tokens', function (done) {
        const stub = sinon.stub(mailer, 'sendEmail', function (spec, callback) {
            const linkPieces = spec.link.split('/');
            token = linkPieces[linkPieces.length - 1];
            callback(null);
        });
        store.server
            .post('/api/v1.0/reset-tokens')
            .send({
                email: userExample.email
            })
            .expect(201)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                expect(stub.called).to.equal(true);
                mailer.sendEmail.restore();
                expect(!!token).to.equal(true);
                done();
            });
    });

    it('verify user can not login', shared.badLoginFn(store, userExample));

    it('reset password', function (done) {
        store.server
            .post('/api/v1.0/users/password')
            .send({
                token,
                password: 'newPassword'
            })
            .expect(201, done);
    });

    it('verify user can not login with old password', shared.badLoginFn(store, userExample));

    it('verify user can login', shared.loginFn(store, {
        username: userExample.username,
        password: 'newPassword'
    }));
});
