'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createSignature = function createSignature(req, res) {
    const { consentDocumentId, language } = _.get(req, 'swagger.params.consent_document.value');
    const signature = {
        consentDocumentId,
        userId: req.user.id,
        language,
        ip: req.ip,
        userAgent: _.get(req, 'headers.user-agent'),
    };
    req.models.consentSignature.createSignature(signature)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.bulkCreateSignatures = function bulkCreateSignatures(req, res) {
    const input = _.get(req, 'swagger.params.consent_documents.value');
    const common = {
        userId: req.user.id,
        language: input.language,
        ip: req.ip,
        userAgent: _.get(req, 'headers.user-agent'),
    };
    req.models.consentSignature.bulkCreateSignatures(input.consentDocumentIds, common)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getSignatureHistory = function getSignatureHistory(req, res) {
    const userId = _.get(req, 'swagger.params.user-id.value');
    req.models.consentSignature.getSignatureHistory(userId)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
