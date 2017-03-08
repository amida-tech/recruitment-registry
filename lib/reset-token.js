'use strict';

const nodemailer = require('nodemailer');

const config = require('../config');
const models = require('../models');
const RRError = require('./rr-error');
const SPromise = require('./promise');

module.exports = function (email, language) {
    return models.smtp.getSmtp({ language })
        .then((smtp) => {
            if (!smtp) {
                return RRError.reject('smtpNotSpecified');
            }
            if (!(smtp.subject && smtp.content)) {
                return RRError.reject('smtpTextNotSpecified');
            }
            return smtp;
        })
        .then(smtp => models.user.resetPasswordToken(email)
                .then((token) => {
                    const link = config.clientBaseUrl + token;
                    const text = smtp.content.replace(/\$\{link\}/g, link);
                    const { protocol, username, password, host } = smtp;
                    const options = {
                        protocol,
                        auth: {
                            user: username,
                            pass: password,
                        },
                        host,
                    };
                    if (smtp.otherOptions) {
                        Object.assign(options, smtp.otherOptions);
                    }
                    const mailerOptions = {
                        to: email,
                        from: smtp.from,
                        subject: smtp.subject,
                        text,
                    };
                    Object.assign(mailerOptions, smtp.otherOptions);
                    return new SPromise((resolve, reject) => {
                        const transporter = nodemailer.createTransport(options);
                        transporter.sendMail(mailerOptions, (err) => {
                            if (err) {
                                return reject(err);
                            }
                            return resolve();
                        });
                    });
                }));
};
