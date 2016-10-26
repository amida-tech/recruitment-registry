/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');

const helper = require('../util/survey-common');

const SharedIntegration = require('../util/shared-integration');
const userExamples = require('../fixtures/example/user');
const surveyExamples = require('../fixtures/example/survey');

const config = require('../../config');
const mailer = require('../../lib/mailer');
const RRError = require('../../lib/rr-error');

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

    it('error: no smtp settings is specified', function (done) {
        store.server
            .post(`/api/v1.0/reset-tokens`)
            .send({
                email: userExample.email
            })
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.equal(RRError.message('smtpNotSpecified'));
                done();
            });
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const smtpSpec = {
        protocol: 'smtp',
        username: 'smtp@example.com',
        password: 'pw',
        host: 'localhost',
        from: userExample.email,
        otherOptions: {}
    };

    it('setup server specifications', function (done) {
        store.server
            .post('/api/v1.0/smtp')
            .set('Authorization', store.auth)
            .send(smtpSpec)
            .expect(204, done);
    });

    it('logout as super', shared.logoutFn(store));

    it('error: no email subject/content is specified', function (done) {
        store.server
            .post(`/api/v1.0/reset-tokens`)
            .send({
                email: userExample.email
            })
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.not.equal(RRError.message('unknown'));
                expect(res.body.message).to.equal(RRError.message('smtpTextNotSpecified'));
                done();
            });
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const smtpText = {
        subject: 'Registry Admin',
        content: 'Click on this: ${link}',
    };

    it('setup server specifications', function (done) {
        store.server
            .patch('/api/v1.0/smtp/text/en')
            .set('Authorization', store.auth)
            .send(smtpText)
            .expect(204, done);
    });

    it('logout as super', shared.logoutFn(store));

    it('error: generate reset tokens', function (done) {
        const stub = sinon.stub(mailer, 'sendEmail', function (uri, options, callback) {
            callback(new Error(options.subject));
        });
        store.server
            .post('/api/v1.0/reset-tokens')
            .send({
                email: userExample.email
            })
            .expect(500)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(stub.called).to.equal(true);
                expect(!!res.body.message).to.equal(true);
                mailer.sendEmail.restore();
                done();
            });
    });

    it('generate reset tokens', function (done) {
        const stub = sinon.stub(mailer, 'sendEmail', function (uri, options, callback) {
            const linkPieces = options.text.split('/');
            token = linkPieces[linkPieces.length - 1];
            callback(null);
        });
        store.server
            .post('/api/v1.0/reset-tokens')
            .send({
                email: userExample.email
            })
            .expect(204)
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
            .expect(204, done);
    });

    it('verify user can not login with old password', shared.badLoginFn(store, userExample));

    it('verify user can login', shared.loginFn(store, {
        username: userExample.username,
        password: 'newPassword'
    }));
});
