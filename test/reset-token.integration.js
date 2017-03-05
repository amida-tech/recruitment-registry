/* global describe,before,after,it*/

'use strict';

process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const stream = require('stream');

const chai = require('chai');
const smtpServer = require('smtp-server');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');

const config = require('../config');
const RRError = require('../lib/rr-error');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('reset-token integration', () => {
    const userExample = generator.newUser();
    const surveyExample = generator.newSurvey();

    // -------- set up system (syncAndLoadAlzheimer)

    const store = new RRSuperTest();

    const receivedEmail = {
        auth: null,
        from: null,
        to: null,
        content: '',
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
                user: 1,
            });
        },
        onMailFrom(address, session, callback) {
            receivedEmail.from = address.address;
            if (address.address.indexOf('smtp') >= 0) {
                return callback(null);
            }
            return callback(new Error('invalid'));
        },
        onRcptTo(address, session, callback) {
            receivedEmail.to = address.address;
            callback();
        },
        onData(stream, session, callback) {
            stream.pipe(smtpStream);
            stream.on('end', callback);
        },
    });

    before(shared.setUpFn(store));

    it('start smtp server', () => {
        server.listen(9001);
    });

    it('login as super user', shared.loginFn(store, config.superUser));

    it('create registry', shared.createSurveyProfileFn(store, surveyExample));

    it('logout as super user', shared.logoutFn(store));

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', (done) => {
        store.get('/profile-survey', false, 200)
            .expect((res) => {
                survey = res.body.survey;
            })
            .end(done);
    });

    // --------- set up account

    let answers;

    it('fill user profile and submit', (done) => {
        answers = generator.answerQuestions(survey.questions);
        const user = userExample;
        store.post('/profiles', { user, answers }, 201).end(done);
    });

    // --------- login

    it('verify user can login', shared.loginFn(store, userExample));

    let token = null;

    it('error: no smtp settings is specified', (done) => {
        const email = userExample.email;
        store.post('/reset-tokens', { email }, 400)
            .expect((res) => {
                expect(res.body.message).to.equal(RRError.message('smtpNotSpecified'));
            })
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const smtpSpec = {
        protocol: 'smtp',
        username: 'smtp@example.com',
        password: 'pw',
        host: 'localhost',
        from: 'admin@rr.com',
        otherOptions: {},
    };

    it('setup server specifications', (done) => {
        store.post('/smtp', smtpSpec, 204).end(done);
    });

    it('logout as super', shared.logoutFn(store));

    it('error: no email subject/content is specified', (done) => {
        const email = userExample.email;
        store.post('/reset-tokens', { email }, 400)
            .expect((res) => {
                expect(res.body.message).to.not.equal(RRError.message('unknown'));
                expect(res.body.message).to.equal(RRError.message('smtpTextNotSpecified'));
            })
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const actualLink = '${link}'; // eslint-disable-line no-template-curly-in-string
    const smtpText = {
        subject: 'Registry Admin',
        content: `Click on this: ${actualLink}`,
    };

    it('setup server specifications', (done) => {
        store.patch('/smtp/text/en', smtpText, 204).end(done);
    });

    it('logout as super', shared.logoutFn(store));

    it('error: generate reset tokens', (done) => {
        const email = userExample.email;
        store.post('/reset-tokens', { email }, 500).end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('setup server specifications', (done) => {
        smtpSpec.from = 'smtp@rr.com';
        store.post('/smtp', smtpSpec, 204).end(done);
    });

    it('logout as super', shared.logoutFn(store));

    it('generate reset tokens', (done) => {
        const email = userExample.email;
        store.post('/reset-tokens', { email }, 204).end(done);
    });

    it('verify user can not login', shared.badLoginFn(store, userExample));

    it('checked received email and recover token', () => {
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

    it('reset password', (done) => {
        const password = 'newPassword';
        store.post('/users/password', { token, password }, 204).end(done);
    });

    it('verify user can not login with old password', shared.badLoginFn(store, userExample));

    it('verify user can login', shared.loginFn(store, {
        username: userExample.username,
        password: 'newPassword',
    }));

    after((done) => {
        server.close(done);
    });
});
