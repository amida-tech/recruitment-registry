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

exports.updateProfileSurveyText = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    profileSurvey.updateProfileSurveyText(req.body, language)
        .then(result => res.status(204).json(result))
        .catch(shared.handleError(res));
};
