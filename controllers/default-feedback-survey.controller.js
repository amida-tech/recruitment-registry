'use strict';

const shared = require('./shared.js');

exports.createDefaultFeedbackSurvey = function createDefaultFeedbackSurvey(req, res) {
    req.models.feedbackSurvey.createFeedbackSurvey(req.body)
        .then(result => res.status(204).json(result))
        .catch(shared.handleError(res));
};

exports.deleteDefaultFeedbackSurvey = function deleteDefaultFeedbackSurvey(req, res) {
    req.models.feedbackSurvey.deleteFeedbackSurvey()
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
