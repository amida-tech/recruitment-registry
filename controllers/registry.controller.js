'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createRegistry = function createRegistry(req, res) {
    req.models.registry.createRegistry(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getRegistry = function getRegistry(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.registry.getRegistry(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteRegistry = function deleteRegistry(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.registry.deleteRegistry(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listRegistries = function listRegistries(req, res) {
    req.models.registry.listRegistries()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
