'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const DocumentSignature = models.DocumentSignature;

exports.createSignature = function (req, res) {
    const { documentId } = _.get(req, 'swagger.params.document.value');
    DocumentSignature.createSignature(req.user.id, documentId)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};
