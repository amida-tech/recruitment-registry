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

exports.getConsentDocumentByTypeName = function getConsentDocumentByTypeName(req, res) {
    const typeName = _.get(req, 'swagger.params.typeName.value');
    const language = _.get(req, 'swagger.params.language.value');
    req.models.consentDocument.getConsentDocumentByTypeName(typeName, { language })
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
