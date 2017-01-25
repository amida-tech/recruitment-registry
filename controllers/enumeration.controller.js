'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.createEnumeration = function (req, res) {
    models.enumeration.createEnumeration(req.body)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.deleteEnumeration = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.enumeration.deleteEnumeration(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getEnumeration = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    models.enumeration.getEnumeration(id, language)
        .then(enumeration => res.status(200).json(enumeration))
        .catch(shared.handleError(res));
};

exports.listEnumerations = function (req, res) {
    models.enumeration.listEnumerations()
        .then(enumerations => res.status(200).json(enumerations))
        .catch(shared.handleError(res));
};
