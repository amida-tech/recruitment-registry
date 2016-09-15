'use strict';

const util = require('util');
var nodemailer = require('nodemailer');

const config = require('../config');
const models = require('../models');

const User = models.User;

const youLine = 'You have requested the reset of the password for your registry account';
const clickLine = 'Please click on the following link, or paste into your browser:';
const ifnotLine = 'If you did not request a reset, please ignore this email.';

exports.sendEmail = function (res, next, email, text, token) {
    var options = {
        from: util.format('"%s" <%s>', config.resetPw.emailName, config.resetPw.emailFrom),
        to: email,
        subject: 'Registry Password Reset',
        text: text
    };
    var transporter = nodemailer.createTransport(config.resetPw.emailUri);
    transporter.sendMail(options, function (err, info) {
        if (err) {
            res.status(403);
            return next(err);
        }
        res.status(201).json({});
    });
};

exports.resetToken = function (req, res, next) {
    const email = req.body.email;
    User.resetPasswordToken(email).then(function (token) {
        const link = config.resetPw.clientBaseUrl + token;
        const text = util.format('%s\n%s\n%s\n\n%s\n', youLine, clickLine, link, ifnotLine);
        exports.sendEmail(res, next, email, text, token);
    }).catch(function (err) {
        res.status(403);
        next(err);
    });
};
