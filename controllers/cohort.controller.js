'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createCohort = function (req, res) {
    req.models.cohort.createCohort(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getCohort = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.cohort.getCohort(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.patchCohort = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.cohort.patchCohort(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteCohort = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.cohort.deleteCohort(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listCohorts = function (req, res) {
    req.models.cohort.listCohorts()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
