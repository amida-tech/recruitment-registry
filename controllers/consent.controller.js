'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createConsent = function createConsent(req, res) {
    const consent = req.body;
    req.models.consent.createConsent(consent)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.deleteConsent = function deleteConsent(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.consent.deleteConsent(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getConsent = function getConsent(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.consent.getConsent(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentByName = function getConsentByName(req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    req.models.consent.getConsentByName(name)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listConsents = function listConsents(req, res) {
    req.models.consent.listConsents()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentDocuments = function getConsentDocuments(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const options = {
        role: _.get(req, 'swagger.params.role.value'),
        roleOnly: _.get(req, 'swagger.params.role-only.value'),
        language: _.get(req, 'swagger.params.language.value'),
    };
    req.models.consent.getConsentDocuments(id, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentDocumentsByName = function getConsentDocumentsByName(req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    const options = {
        role: _.get(req, 'swagger.params.role.value'),
        roleOnly: _.get(req, 'swagger.params.role-only.value'),
        language: _.get(req, 'swagger.params.language.value'),
    };
    req.models.consent.getConsentDocumentsByName(name, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocuments = function getUserConsentDocuments(req, res) {
    const { id: userId, role } = req.user;
    const id = _.get(req, 'swagger.params.id.value');
    const options = {
        role,
        roleOnly: _.get(req, 'swagger.params.role-only.value'),
        language: _.get(req, 'swagger.params.language.value'),
    };
    req.models.consent.getUserConsentDocuments(userId, id, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocumentsByName = function getUserConsentDocumentsByName(req, res) {
    const { id: userId, role } = req.user;
    const name = _.get(req, 'swagger.params.name.value');
    const options = {
        role,
        roleOnly: _.get(req, 'swagger.params.role-only.value'),
        language: _.get(req, 'swagger.params.language.value'),
    };
    req.models.consent.getUserConsentDocumentsByName(userId, name, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
