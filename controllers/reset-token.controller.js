'use strict';

const smtpHelper = require('../lib/smtp-helper');

const shared = require('./shared.js');

exports.resetToken = function resetTokenFunction(req, res) {
    const email = req.body.email;
    const language = req.body.language;
    smtpHelper.resetToken(req.models, email, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
