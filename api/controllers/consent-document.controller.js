'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const ConsentDocument = models.ConsentDocument;

exports.createConsentDocument = function (req, res) {
    ConsentDocument.createConsentDocument(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentDocument = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    ConsentDocument.getConsentDocument(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUpdateCommentHistory = function (req, res) {
    const typeId = _.get(req, 'swagger.params.typeId.value');
    ConsentDocument.getUpdateCommentHistory(typeId)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
