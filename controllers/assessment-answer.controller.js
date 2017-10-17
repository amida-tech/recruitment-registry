'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createAssessmentAnswers = function createAssessmentAnswers(req, res) {
    const answers = req.body;
    answers.userId = req.user.id;
    req.models.answer.createAnswers(answers)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getAssessmentAnswers = function getAssessmentAnswers(req, res) {
    const assessmentId = _.get(req, 'swagger.params.assessment-id.value');
    const userId = req.user.id;
    const masterId = {};
    if (assessmentId) {
        masterId.assessmentId = assessmentId;
    } else {
        masterId.userId = userId;
    }
    req.models.answer.getAnswers(masterId)
        .then(answers => res.status(200).json(answers))
        .catch(shared.handleError(res));
};
