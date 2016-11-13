'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const consentDocument = models.consentDocument;

exports.listConsentDocuments = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    models.user.listConsentDocuments(req.user.id, { language })
        .then(consentDocuments => res.status(200).json(consentDocuments))
        .catch(shared.handleError(res));
};

exports.getSignedConsentDocument = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    consentDocument.getSignedConsentDocument(req.user.id, id, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getSignedConsentDocumentByTypeName = function (req, res) {
    const typeName = _.get(req, 'swagger.params.typeName.value');
    const language = _.get(req, 'swagger.params.language.value');
    consentDocument.getSignedConsentDocumentByTypeName(req.user.id, typeName, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
