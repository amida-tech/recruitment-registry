'use strict';

const nodemailer = require('nodemailer');

module.exports = {
    sendEmail(uri, options, callback) {
        const transporter = nodemailer.createTransport(uri);
        transporter.sendMail(options, callback);
    }
};
