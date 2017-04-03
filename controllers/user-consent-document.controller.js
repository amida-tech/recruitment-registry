'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.listUserConsentDocuments = function listUserConsentDocuments(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const includeSigned = _.get(req, 'swagger.params.include-signed.value');
    req.models.userConsentDocument.listUserConsentDocuments(req.user.id, { language, includeSigned })
        .then(consentDocuments => res.status(200).json(consentDocuments))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocument = function getUserConsentDocument(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    req.models.userConsentDocument.getUserConsentDocument(req.user.id, id, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocumentByTypeName = function getUserConsentDocumentByTypeName(req, res) {
    const typeName = _.get(req, 'swagger.params.typeName.value');
    const language = _.get(req, 'swagger.params.language.value');
    req.models.userConsentDocument.getUserConsentDocumentByTypeName(req.user.id, typeName, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
