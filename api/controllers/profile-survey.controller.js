'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const profileSurvey = models.profileSurvey;

exports.createProfileSurvey = function (req, res) {
    profileSurvey.createProfileSurvey(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getProfileSurvey = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    profileSurvey.getProfileSurvey(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.createProfileSurveyId = function (req, res) {
    profileSurvey.createProfileSurveyId(req.body.profileSurveyId)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getProfileSurveyId = function (req, res) {
    profileSurvey.getProfileSurveyId()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteProfileSurveyId = function (req, res) {
    profileSurvey.deleteProfileSurveyId()
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
