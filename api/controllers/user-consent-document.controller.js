'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const userConsentDocument = models.userConsentDocument;

exports.listUserConsentDocuments = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    userConsentDocument.listUserConsentDocuments(req.user.id, { language })
        .then(consentDocuments => res.status(200).json(consentDocuments))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocument = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    userConsentDocument.getUserConsentDocument(req.user.id, id, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserConsentDocumentByTypeName = function (req, res) {
    const typeName = _.get(req, 'swagger.params.typeName.value');
    const language = _.get(req, 'swagger.params.language.value');
    userConsentDocument.getUserConsentDocumentByTypeName(req.user.id, typeName, { language })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
