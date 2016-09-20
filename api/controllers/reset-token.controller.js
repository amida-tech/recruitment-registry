'use strict';

const _ = require('lodash');

const config = require('../config');
const models = require('../models');
const shared = require('./shared.js');
const mailer = require('../lib/mailer');

const User = models.User;

exports.resetToken = function (req, res) {
    const email = req.body.email;
    User.resetPasswordToken(email)
        .then(function (token) {
            const options = _.assign(config.resetPw, {
                emailTo: email,
                link: config.resetPw.clientBaseUrl + token
            });
            mailer.sendEmail(options, function (err) {
                if (err) {
                    return shared.handleError(res)(err);
                }
                res.status(201).json({});
            });
        })
        .catch(shared.handleError(res));
};
