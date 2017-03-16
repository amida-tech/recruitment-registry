'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createSurveyConsent = function (req, res) {
    req.models.surveyConsent.createSurveyConsent(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.deleteSurveyConsent = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.surveyConsent.deleteSurveyConsent(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listSurveyConsents = function (req, res) {
    const surveyId = _.get(req, 'swagger.params.survey-id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = { language };
    req.models.surveyConsent.listSurveyConsents(surveyId, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
