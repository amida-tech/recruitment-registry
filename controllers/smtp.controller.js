'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createSmtp = function (req, res) {
    req.models.smtp.createSmtp(req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getSmtp = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    req.models.smtp.getSmtp(options)
        .then((smtp) => {
            if (smtp) {
                res.status(200).json({ exists: true, smtp });
            } else {
                res.status(200).json({ exists: false });
            }
        })
        .catch(shared.handleError(res));
};

exports.updateSmtpText = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    req.models.smtp.updateSmtpText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteSmtp = function (req, res) {
    req.models.smtp.deleteSmtp()
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
