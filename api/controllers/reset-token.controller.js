'use strict';

const _ = require('lodash');

const config = require('../config');
const models = require('../models');
const mailer = require('../lib/mailer');

const User = models.User;

exports.resetToken = function (req, res, next) {
    const email = req.body.email;
    User.resetPasswordToken(email).then(function (token) {
        const options = _.assign(config.resetPw, {
            emailTo: email,
            link: config.resetPw.clientBaseUrl + token
        });
        mailer.sendEmail(options, function (err) {
            if (err) {
                res.status(403);
                return next(err);
            }
            res.status(201).json({});
        });
    }).catch(function (err) {
        res.status(403);
        next(err);
    });
};
