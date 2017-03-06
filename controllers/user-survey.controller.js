'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const userSurvey = models.userSurvey;

exports.getUserSurveyStatus = function (req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    userSurvey.getUserSurveyStatus(userId, surveyId)
        .then(result => res.status(200).json({ status: result }))
        .catch(shared.handleError(res));
};

exports.createUserSurveyAnswers = function (req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    userSurvey.createUserSurveyAnswers(userId, surveyId, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getUserSurveyAnswers = function (req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    const options = {
        language: _.get(req, 'swagger.params.language.value'),
        includeSurvey: _.get(req, 'swagger.params.include-survey.value'),
    };
    userSurvey.getUserSurveyAnswers(userId, surveyId, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserSurvey = function (req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    const options = {
        language: _.get(req, 'swagger.params.language.value'),
    };
    userSurvey.getUserSurvey(userId, surveyId, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listUserSurveys = function (req, res) {
    const userId = req.user.id;
    const language = _.get(req, 'swagger.params.language.value');
    const options = { language };
    models.userSurvey.listUserSurveys(userId, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
