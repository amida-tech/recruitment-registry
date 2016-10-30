'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const consentType = models.consentType;

exports.createConsentType = function (req, res) {
    consentType.createConsentType(req.body)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.updateConsentTypeText = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    consentType.updateConsentTypeText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getConsentType = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    consentType.getConsentType(id, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listConsentTypes = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    consentType.listConsentTypes(options)
        .then(docTypes => res.status(200).json(docTypes))
        .catch(shared.handleError(res));
};

exports.deleteConsentType = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    consentType.deleteConsentType(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
