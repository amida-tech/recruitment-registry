'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const Smtp = models.Smtp;

exports.createSmtp = function (req, res) {
    Smtp.createSmtp(req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getSmtp = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    Smtp.getSmtp(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.updateSmtpText = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    Smtp.updateSmtpText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteSmtp = function (req, res) {
    Smtp.deleteSmtp()
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
