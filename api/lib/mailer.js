'use strict';

const nodemailer = require('nodemailer');
const _ = require('lodash');

const lines = [
    'You have requested the reset of the password for your registry account',
    'Please click on the following link, or paste into your browser:',
    '',
    'If you did not request a reset, please ignore this email.',
    ''
];

const emailText = function (link) {
    const textLines = lines.slice();
    textLines.splice(2, 0, link);
    return textLines.join('\n');
};

exports.sendEmail = function (options, callback) {
    const _options = {
        from: `"${options.emailName}" <${options.emailFrom}>`,
        to: options.emailTo,
        subject: options.emailSubject,
        text: emailText(options.link)
    };
    const otherOptions = _.omit(options, ['emailName', 'emailFrom', 'emailTo', 'emailSubject', 'link', 'emailUri']);
    Object.assign(_options, otherOptions);
    const transporter = nodemailer.createTransport(options.emailUri);
    transporter.sendMail(_options, callback);
};
