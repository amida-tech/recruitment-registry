'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.createRegistry = function (req, res) {
    models.registry.createRegistry(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getRegistry = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.registry.getRegistry(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteRegistry = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.registry.deleteRegistry(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listRegistries = function (req, res) {
    models.registry.listRegistries()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
