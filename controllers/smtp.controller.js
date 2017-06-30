'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createSmtp = function createSmtp(req, res) {
    const type = _.get(req, 'swagger.params.type.value');
    const smtp = Object.assign({ type }, req.body);
    req.models.smtp.createSmtp(smtp)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getSmtp = function getSmtp(req, res) {
    const type = _.get(req, 'swagger.params.type.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language, type } : { type };
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

exports.updateSmtpText = function updateSmtpText(req, res) {
    const type = _.get(req, 'swagger.params.type.value');
    const language = _.get(req, 'swagger.params.language.value');
    const smtp = Object.assign({ type }, req.body);
    req.models.smtp.updateSmtpText(smtp, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteSmtp = function deleteSmtp(req, res) {
    const type = _.get(req, 'swagger.params.type.value');
    req.models.smtp.deleteSmtp(type)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
