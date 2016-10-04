'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const DocumentType = models.DocumentType;

exports.createDocumentType = function (req, res) {
    DocumentType.createDocumentType(req.body)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.listDocumentTypes = function (req, res) {
    DocumentType.listDocumentTypes()
        .then(docTypes => res.status(200).json(docTypes))
        .catch(shared.handleError(res));
};

exports.deleteDocumentType = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    DocumentType.deleteDocumentType(id)
        .then(() => res.status(204).json({}))
        .catch(shared.handleError(res));
};
