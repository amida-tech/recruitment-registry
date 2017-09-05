'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createSurveyConsent = function createSurveyConsent(req, res) {
    req.models.surveyConsent.createSurveyConsent(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.deleteSurveyConsent = function deleteSurveyConsent(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.surveyConsent.deleteSurveyConsent(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listSurveyConsents = function listSurveyConsents(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = { language };
    req.models.surveyConsent.listSurveyConsents(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
