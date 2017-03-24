'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createFilter = function (req, res) {
    req.models.filter.createFilter(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getFilter = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.filter.getFilter(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.patchFilter = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.filter.patchFilter(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteFilter = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.filter.deleteFilter(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listFilters = function (req, res) {
   req.models.filter.listFilters()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
