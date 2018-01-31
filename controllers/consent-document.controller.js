'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createConsentDocument = function createConsentDocument(req, res) {
    req.models.consentDocument.createConsentDocument(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentDocument = function getConsentDocument(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    req.models.consentDocument.getConsentDocument(id, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentDocumentByTypeId = function getConsentDocumentByTypeId(req, res) {
    const typeId = _.get(req, 'swagger.params.typeId.value');
    const language = _.get(req, 'swagger.params.language.value');
    req.models.consentDocument.getConsentDocumentByTypeId(typeId, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.updateConsentDocumentText = function updateConsentDocumentText(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    req.models.consentDocument.updateConsentDocumentText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getUpdateCommentHistory = function getUpdateCommentHistory(req, res) {
    const typeId = _.get(req, 'swagger.params.typeId.value');
    const language = _.get(req, 'swagger.params.language.value');
    req.models.consentDocument.getUpdateCommentHistory(typeId, language)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listConsentDocuments = function listConsentDocuments(req, res) {
    const surveys = _.get(req, 'swagger.params.surveys.value');
    const language = _.get(req, 'swagger.params.language.value');
    const history = _.get(req, 'swagger.params.history.value');
    const summary = _.get(req, 'swagger.params.summary.value');
    const keepTypeId = _.get(req, 'swagger.params.keep-type-id.value');
    const role = _.get(req, 'swagger.params.role.value');
    const roleOnly = _.get(req, 'swagger.params.role-only.value');
    const options = {
        language, surveys, history, summary, keepTypeId, role, roleOnly,
    };
    req.models.consentDocument.listConsentDocuments(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
