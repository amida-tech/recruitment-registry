'use strict';

const nodemailer = require('nodemailer');

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

exports.sendEmail = function (spec, callback) {
    const options = {
        from: `"${spec.emailName}" <${spec.emailFrom}>`,
        to: spec.emailTo,
        subject: spec.emailSubject,
        text: emailText(spec.link)
    };
    const transporter = nodemailer.createTransport(spec.emailUri);
    transporter.sendMail(options, callback);
};
