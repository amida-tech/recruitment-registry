'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const consentSignature = models.consentSignature;

exports.createSignature = function (req, res) {
    const { consentDocumentId } = _.get(req, 'swagger.params.consent_document.value');
    const userId = req.user.id;
    const language = _.get(req, 'swagger.params.language.value');
    const ip = req.ip;
    const userAgent = _.get(req, 'headers.user-agent');
    consentSignature.createSignature({ consentDocumentId, userId, language, ip, userAgent })
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.bulkCreateSignatures = function (req, res) {
    const consentDocumentIds = _.get(req, 'swagger.params.consent_documents.value');
    const userId = req.user.id;
    const language = _.get(req, 'swagger.params.language.value');
    const ip = req.ip;
    const userAgent = _.get(req, 'headers.user-agent');
    consentSignature.bulkCreateSignatures(consentDocumentIds, { userId, language, ip, userAgent })
        .then((result) => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getSignatureHistory = function (req, res) {
    const userId = _.get(req, 'swagger.params.id.value');
    consentSignature.getSignatureHistory(userId)
        .then((result) => res.status(200).json(result))
        .catch(shared.handleError(res));

};
