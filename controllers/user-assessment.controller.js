'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.openUserAssessment = function openUserAssessment(req, res) {
    req.models.userAssessment.openUserAssessment(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.closeUserAssessment = function closeUserAssessment(req, res) {
    const userId = _.get(req, 'swagger.params.user-id.value');
    const assessmentId = _.get(req, 'swagger.params.assessment-id.value');
    req.models.userAssessment.closeUserAssessment({ userId, assessmentId })
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listUserAssessments = function listUserAssessments(req, res) {
    const userId = _.get(req, 'swagger.params.user-id.value');
    const assessmentId = _.get(req, 'swagger.params.assessment-id.value');
    req.models.userAssessment.listUserAssessments(userId, assessmentId)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listUserAssessmentAnswers = function listUserAssessmentAnswers(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.userAssessment.listUserAssessmentAnswers(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
