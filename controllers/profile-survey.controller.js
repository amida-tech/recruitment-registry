'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createProfileSurvey = function createProfileSurvey(req, res) {
    req.models.profileSurvey.createProfileSurvey(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getProfileSurvey = function getProfileSurvey(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    const role = _.get(req, 'user.role');
    options.admin = (role === 'admin');
    req.models.profileSurvey.getProfileSurvey(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.createProfileSurveyId = function createProfileSurveyId(req, res) {
    req.models.profileSurvey.createProfileSurveyId(req.body.profileSurveyId)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getProfileSurveyId = function getProfileSurveyId(req, res) {
    req.models.profileSurvey.getProfileSurveyId()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteProfileSurveyId = function deleteProfileSurveyId(req, res) {
    req.models.profileSurvey.deleteProfileSurveyId()
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
