'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createFeedbackSurvey = function createFeedbackSurvey(req, res) {
    req.models.feedbackSurvey.createFeedbackSurvey(req.body)
        .then(result => res.status(204).json(result))
        .catch(shared.handleError(res));
};

exports.getFeedbackSurvey = function getFeedbackSurvey(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const full = _.get(req, 'swagger.params.full.value');
    const options = language ? { language, full } : { full };
    req.models.feedbackSurvey.getFeedbackSurvey(id, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteFeedbackSurvey = function deleteFeedbackSurvey(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.feedbackSurvey.deleteFeedbackSurvey(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listFeedbackSurveys = function getFeedbackSurvey(req, res) {
    req.models.feedbackSurvey.listFeedbackSurveys()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
