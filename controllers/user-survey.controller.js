'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.getUserSurveyStatus = function getUserSurveyStatus(req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    req.models.userSurvey.getUserSurveyStatus(userId, surveyId)
        .then(result => res.status(200).json({ status: result }))
        .catch(shared.handleError(res));
};

exports.createUserSurveyAnswers = function createUserSurveyAnswers(req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    req.models.userSurvey.createUserSurveyAnswers(userId, surveyId, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getUserSurveyAnswers = function getUserSurveyAnswers(req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    const options = {
        language: _.get(req, 'swagger.params.language.value'),
        includeSurvey: _.get(req, 'swagger.params.include-survey.value'),
        isIdentifying: _.get(req, 'swagger.params.isIdentifying.value'),
    };
    req.models.userSurvey.getUserSurveyAnswers(userId, surveyId, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getUserSurvey = function getUserSurvey(req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.id.value');
    const options = {
        language: _.get(req, 'swagger.params.language.value'),
    };
    req.models.userSurvey.getUserSurvey(userId, surveyId, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.listUserSurveys = function listUserSurveys(req, res) {
    const userId = req.user.id;
    const language = _.get(req, 'swagger.params.language.value');
    const options = { language };
    req.models.userSurvey.listUserSurveys(userId, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
