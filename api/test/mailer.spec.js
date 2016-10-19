/* global describe,before,after,it*/
'use strict';
process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const stream = require('stream');

const chai = require('chai');

const mailer = require('../lib/mailer');
const smtpServer = require('smtp-server');

const expect = chai.expect;

describe('mailer unit', function () {
    const store = {
        auth: null,
        from: null,
        to: null
    };

    class SMTPStream extends stream.Writable {
        _write(chunk, enc, next) {
            next();
        }
    }

    const smtpStream = new SMTPStream();

    const server = new smtpServer.SMTPServer({
        name: 'localhost',
        authOptional: true,
        onAuth: function (auth, session, callback) {
            store.auth = auth;
            callback(null, {
                user: 1
            });
        },
        onMailFrom: function (address, session, callback) {
            store.from = address.address;
            callback(null);
        },
        onRcptTo: function (address, session, callback) {
            store.to = address.address;
            callback(null);
        },
        onData: function (stream, session, callback) {
            stream.pipe(smtpStream);
            stream.on('end', callback);
        }
    });

    const mailerSpec = {
        emailUri: 'smtp://test@example.com:pw@localhost:9001',
        emailTo: 'test@example.com',
        emailFrom: 'admin@example.com',
        emailName: 'Registry Administration',
        emailSubject: 'Registry Password Reset'
    };

    before(function () {
        server.listen(9001);
    });

    it('send email', function (done) {
        mailer.sendEmail(mailerSpec, done);
    });

    it('check email', function () {
        expect(store.auth.username).to.equal('test@example.com');
        expect(store.auth.password).to.equal('pw');
        expect(store.from).to.equal(mailerSpec.emailFrom);
        expect(store.to).to.equal(mailerSpec.emailTo);
    });

    after(function (done) {
        server.close(done);
    });
});
