/* global describe,before,after,it*/
'use strict';
process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const stream = require('stream');

const chai = require('chai');
const smtpServer = require('smtp-server');

const helper = require('./util/survey-common');

const SharedIntegration = require('./util/shared-integration');
const userExamples = require('./fixtures/example/user');
const surveyExamples = require('./fixtures/example/survey');

const config = require('../config');
const RRError = require('../lib/rr-error');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('reset-token integration', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    // -------- set up system (syncAndLoadAlzheimer)

    const store = {
        server: null,
        auth: null
    };

    const receivedEmail = {
        auth: null,
        from: null,
        to: null,
        content: ''
    };

    class SMTPStream extends stream.Writable {
        _write(chunk, enc, next) {
            receivedEmail.content += chunk.toString();
            next();
        }
    }

    const smtpStream = new SMTPStream();

    const server = new smtpServer.SMTPServer({
        name: 'localhost',
        authOptional: true,
        onAuth(auth, session, callback) {
            receivedEmail.auth = auth;
            callback(null, {
                user: 1
            });
        },
        onMailFrom(address, session, callback) {
            receivedEmail.from = address.address;
            if (address.address.indexOf('smtp') >= 0) {
                return callback(null);
            } else {
                return callback(new Error('invalid'));
            }
        },
        onRcptTo(address, session, callback) {
            receivedEmail.to = address.address;
            callback();
        },
        onData(stream, session, callback) {
            stream.pipe(smtpStream);
            stream.on('end', callback);
        }
    });

    before(shared.setUpFn(store));

    it('start smtp server', function () {
        server.listen(9001);
    });

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
                survey = res.body.survey;
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

    let token = null;

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
        from: 'admin@rr.com',
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
        store.server
            .post('/api/v1.0/reset-tokens')
            .send({
                email: userExample.email
            })
            .expect(500)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('setup server specifications', function (done) {
        smtpSpec.from = 'smtp@rr.com';
        store.server
            .post('/api/v1.0/smtp')
            .set('Authorization', store.auth)
            .send(smtpSpec)
            .expect(204, done);
    });

    it('logout as super', shared.logoutFn(store));

    it('generate reset tokens', function (done) {
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
                done();
            });
    });

    it('verify user can not login', shared.badLoginFn(store, userExample));

    it('checked received email and recover token', function () {
        expect(receivedEmail.auth.username).to.equal(smtpSpec.username);
        expect(receivedEmail.auth.password).to.equal(smtpSpec.password);
        expect(receivedEmail.from).to.equal(smtpSpec.from);
        expect(receivedEmail.to).to.equal(userExample.email);
        const lines = receivedEmail.content.split('\r\n');
        let subjectFound = false;
        lines.forEach((line, index) => {
            if (line.startsWith('Subject: ')) {
                const subject = line.split('Subject: ')[1];
                expect(subject).to.equal(smtpText.subject);
                subjectFound = true;
            }
            if (line.startsWith('Click on this:')) {
                const linkPieces = line.split('/');
                token = linkPieces[linkPieces.length - 1];
                if (token.charAt(token.length - 1) === '=') {
                    token = token.slice(0, token.length - 1) + lines[index + 1];
                }
            }
        });
        expect(subjectFound).to.equal(true);
        expect(token).to.not.equal(null);
    });

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

    after(function (done) {
        server.close(done);
    });
});
