'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.createConsent = function (req, res) {
    const consent = req.body;
    models.consent.createConsent(consent)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.deleteConsent = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.consent.deleteConsent(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getConsent = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.consent.getConsent(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentByName = function (req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    models.consent.getConsentByName(name)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listConsents = function (req, res) {
    models.consent.listConsents()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentDocuments = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    models.consent.getConsentDocuments(id, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentDocumentsByName = function (req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    const language = _.get(req, 'swagger.params.language.value');
    models.consent.getConsentDocumentsByName(name, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocuments = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    models.consent.getUserConsentDocuments(req.user.id, id, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocumentsByName = function (req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    const language = _.get(req, 'swagger.params.language.value');
    models.consent.getUserConsentDocumentsByName(req.user.id, name, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
