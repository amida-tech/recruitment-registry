'use strict';

const nodemailer = require('nodemailer');

const config = require('../config');
const RRError = require('./rr-error');
const SPromise = require('./promise');

const getSmtp = function (models, type, language) {
    return models.smtp.getSmtp({ type, language })
        .then((smtp) => {
            if (!smtp) {
                return RRError.reject('smtpNotSpecified');
            }
            if (!(smtp.subject && smtp.content)) {
                return RRError.reject('smtpTextNotSpecified');
            }
            return smtp;
        });
};

const sendEmail = function (smtp, email, link) {
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
};

exports.resetToken = function resetToken(models, email, language) {
    return getSmtp(models, 'reset-password', language)
        .then(smtp => models.user.resetPasswordToken(email)
            .then((token) => {
                const link = config.clientBaseUrl + token;
                return sendEmail(smtp, email, link);
            }));
};

exports.sendS3LinkEmail = function sendS3LinkEmail(models, email, language, link) {
    return getSmtp(models, 'cohort-csv', language)
        .then(smtp => sendEmail(smtp, email, link));
};
