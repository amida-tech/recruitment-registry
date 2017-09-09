'use strict';

const smtpServer = require('smtp-server');
const stream = require('stream');

const SMTPStream = class SMTPStream extends stream.Writable {
    constructor(receivedEmail) {
        super();
        this.receivedEmail = receivedEmail;
    }

    _write(chunk, enc, next) { // eslint-disable-line class-methods-use-this
        this.receivedEmail.content += chunk.toString();
        next();
    }
};

module.exports = class RRSMTPServer extends smtpServer.SMTPServer {
    constructor() {
        super({
            name: 'localhost',
            authOptional: true,
            onAuth(auth, session, callback) {
                this.receivedEmail.auth = auth;
                callback(null, {
                    user: 1,
                });
            },
            onMailFrom(address, session, callback) {
                this.receivedEmail.from = address.address;
                if (address.address.indexOf('smtp') >= 0) {
                    return callback(null);
                }
                return callback(new Error('invalid'));
            },
            onRcptTo(address, session, callback) {
                this.receivedEmail.to = address.address;
                callback();
            },
            onData(dataStream, session, callback) {
                dataStream.pipe(new SMTPStream(this.receivedEmail));
                dataStream.on('end', callback);
            },
        });
        this.reset();
    }
    reset() {
        this.receivedEmail = {
            auth: null,
            from: null,
            to: null,
            content: '',
        };
    }
};
