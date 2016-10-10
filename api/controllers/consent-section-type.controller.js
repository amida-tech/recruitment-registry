'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const ConsentSectionType = models.ConsentSectionType;

exports.createConsentSectionType = function (req, res) {
    ConsentSectionType.createConsentSectionType(req.body)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.listConsentSectionTypes = function (req, res) {
    ConsentSectionType.listConsentSectionTypes()
        .then(docTypes => res.status(200).json(docTypes))
        .catch(shared.handleError(res));
};

exports.deleteConsentSectionType = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    ConsentSectionType.deleteConsentSectionType(id)
        .then(() => res.status(204).json({}))
        .catch(shared.handleError(res));
};
