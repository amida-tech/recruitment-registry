'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createAssessmentAnswers = function createAssessmentAnswers(req, res) {
    const answers = req.body;
    answers.userId = req.user.id;
    req.models.assessmentAnswer.createAssessmentAnswers(answers)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getAssessmentAnswers = function getAssessmentAnswers(req, res) {
    const assessmentId = _.get(req, 'swagger.params.assessment-id.value');
    const userId = req.user.id;
    req.models.assessmentAnswer.getAssessmentAnswers({ userId, assessmentId })
        .then(answers => res.status(200).json(answers))
        .catch(shared.handleError(res));
};
