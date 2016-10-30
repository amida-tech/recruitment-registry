'use strict';

const nodemailer = require('nodemailer');

const config = require('../config');
const models = require('../models');
const RRError = require('./rr-error');
const SPromise = require('./promise');

const User = models.User;
const Smtp = models.Smtp;

module.exports = function (email) {
    return Smtp.getSmtp()
        .then(smtp => {
            if (!smtp) {
                return RRError.reject('smtpNotSpecified');
            }
            if (!(smtp.subject && smtp.content)) {
                return RRError.reject('smtpTextNotSpecified');
            }
            return smtp;
        })
        .then(smtp => {
            return User.resetPasswordToken(email)
                .then(token => {
                    const link = config.clientBaseUrl + token;
                    const text = smtp.content.replace(/\$\{link\}/g, link);
                    const { protocol, username, password, host } = smtp;
                    const uri = `${protocol}://${username}:${password}@${host}:9001`;
                    const mailerOptions = {
                        to: email,
                        from: smtp.from,
                        subject: smtp.subject,
                        text
                    };
                    Object.assign(mailerOptions, smtp.otherOptions);
                    return new SPromise(function (resolve, reject) {
                        const transporter = nodemailer.createTransport(uri);
                        transporter.sendMail(mailerOptions, function (err) {
                            if (err) {
                                return reject(err);
                            }
                            resolve();
                        });
                    });
                });
        });
};
