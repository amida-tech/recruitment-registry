'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.createAssessment = function (req, res) {
    models.assessment.createAssessment(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getAssessment = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.assessment.getAssessment(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listAssessments = function (req, res) {
    models.assessment.listAssessments()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
