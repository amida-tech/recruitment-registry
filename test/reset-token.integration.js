/* global describe,before,after,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const stream = require('stream');

const chai = require('chai');
const smtpServer = require('smtp-server');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');

const config = require('../config');

const expect = chai.expect;

describe('reset-token integration', () => {
    const generator = new Generator();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const userExample = generator.newUser();
    const surveyExample = generator.newSurvey();
    const hxUser = new History();

    // -------- set up system (syncAndLoadAlzheimer)

    const receivedEmail = {
        auth: null,
        from: null,
        to: null,
        content: '',
    };

    class SMTPStream extends stream.Writable {
        _write(chunk, enc, next) { // eslint-disable-line class-methods-use-this
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
        onData(dataStream, session, callback) {
            dataStream.pipe(smtpStream);
            dataStream.on('end', callback);
        },
    });

    before(shared.setUpFn());

    it('start smtp server', () => {
        server.listen(9001);
    });

    it('login as super user', shared.loginFn(config.superUser));

    it('create registry', shared.createSurveyProfileFn(surveyExample));

    it('logout as super user', shared.logoutFn());

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', (done) => {
        rrSuperTest.get('/profile-survey', false, 200)
            .expect((res) => {
                survey = res.body.survey;
            })
            .end(done);
    });

    // --------- set up account

    let answers;

    it('fill user profile and submit', function registerUser() {
        answers = generator.answerQuestions(survey.questions);
        const user = userExample;
        return rrSuperTest.post('/profiles', { user, answers }, 201)
            .then((res) => {
                hxUser.push(user, { id: res.body.id });
            });
    });

    // --------- login

    it('verify user can login', shared.loginIndexFn(hxUser, 0));

    let token = null;

    it('error: no smtp settings is specified', (done) => {
        const email = userExample.email;
        rrSuperTest.post('/reset-tokens', { email }, 400)
            .expect(res => shared.verifyErrorMessage(res, 'smtpNotSpecified'))
            .end(done);
    });

    it('login as super', shared.loginFn(config.superUser));

    const smtpSpec = {
        protocol: 'smtp',
        username: 'smtp@example.com',
        password: 'pw',
        host: 'localhost',
        from: 'admin@rr.com',
        otherOptions: {
            port: 9001,
        },
    };

    it('setup server specifications', (done) => {
        rrSuperTest.post('/smtp/reset-password', smtpSpec, 204).end(done);
    });

    it('logout as super', shared.logoutFn());

    it('error: no email subject/content is specified', (done) => {
        const email = userExample.email;
        rrSuperTest.post('/reset-tokens', { email }, 400)
            .expect(res => shared.verifyErrorMessage(res, 'smtpTextNotSpecified'))
            .end(done);
    });

    it('login as super', shared.loginFn(config.superUser));

    const actualLink = '${link}'; // eslint-disable-line no-template-curly-in-string
    const smtpText = {
        subject: 'Registry Admin',
        content: `Click on this: ${actualLink}`,
    };

    it('setup server specifications', (done) => {
        rrSuperTest.patch('/smtp/reset-password/text/en', smtpText, 204).end(done);
    });

    it('logout as super', shared.logoutFn());

    it('error: generate reset tokens', (done) => {
        const email = userExample.email;
        rrSuperTest.post('/reset-tokens', { email }, 500).end(done);
    });

    it('login as super', shared.loginFn(config.superUser));

    it('setup server specifications', (done) => {
        smtpSpec.from = 'smtp@rr.com';
        rrSuperTest.post('/smtp/reset-password', smtpSpec, 204).end(done);
    });

    it('logout as super', shared.logoutFn());

    it('generate reset tokens', (done) => {
        const email = userExample.email;
        rrSuperTest.post('/reset-tokens', { email }, 204).end(done);
    });

    it('verify user can not login', shared.badLoginFn(userExample));

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

    it('reset password', function resetPassword() {
        const password = 'newPassword';
        return rrSuperTest.post('/users/password', { token, password }, 204);
    });

    it('verify user can not login with old password', shared.badLoginFn(userExample));

    it('update client password', function updatePassword() {
        hxUser.client(0).password = 'newPassword';
    });

    it('verify user can login', shared.loginIndexFn(hxUser, 0));

    after((done) => {
        server.close(done);
    });
});
