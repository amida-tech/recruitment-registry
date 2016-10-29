'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const Registry = models.Registry;

exports.createProfileSurvey = function (req, res) {
    Registry.createProfileSurvey(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getProfileSurvey = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    Registry.getProfileSurvey(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.updateProfileSurveyText = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    Registry.updateProfileSurveyText(req.body, language)
        .then(result => res.status(204).json(result))
        .catch(shared.handleError(res));
};
