'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const ConsentType = models.ConsentType;

exports.createConsentType = function (req, res) {
    ConsentType.createConsentType(req.body)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.listConsentTypes = function (req, res) {
    ConsentType.listConsentTypes()
        .then(docTypes => res.status(200).json(docTypes))
        .catch(shared.handleError(res));
};

exports.deleteConsentType = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    ConsentType.deleteConsentType(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
