'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const Survey = models.Survey;

exports.getSurveyById = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Survey.getSurveyById(id)
        .then(survey => res.status(200).json(survey))
        .catch(shared.handleError(res));
};

exports.getSurveyByName = function (req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    Survey.getSurveyByName(name)
        .then(survey => res.status(200).json(survey))
        .catch(shared.handleError(res));
};

exports.createSurvey = function (req, res) {
    const survey = req.body;
    Survey.createSurvey(survey)
        .then(id => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.versionSurvey = function (req, res) {
    const survey = req.body;
    Survey.versionSurvey(survey)
        .then(id => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.updateSurvey = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Survey.updateSurvey(id, req.body)
        .then((result) => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteSurvey = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Survey.deleteSurvey(id)
        .then(() => res.status(204).json({}))
        .catch(shared.handleError(res));
};

exports.releaseSurvey = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Survey.releaseSurvey(id)
        .then((result) => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listSurveys = function (req, res) {
    Survey.listSurveys()
        .then(surveys => res.status(200).json(surveys))
        .catch(shared.handleError(res));
};

exports.getAnsweredSurveyByName = function (req, res) {
    const userId = req.user.id;
    const name = _.get(req, 'swagger.params.name.value');
    Survey.getAnsweredSurveyByName(userId, name)
        .then(survey => res.status(200).json(survey))
        .catch(shared.handleError(res));
};
