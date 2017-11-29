'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createAssessment = function createAssessment(req, res) {
    req.models.assessment.createAssessment(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getAssessment = function getAssessment(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.assessment.getAssessment(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteAssessment = function deleteAssessment(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.assessment.deleteAssessment(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listAssessments = function listAssessments(req, res) {
    const group = _.get(req, 'swagger.params.group.value');
    const options = group ? { group } : {};
    req.models.assessment.listAssessments(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
