'use strict';

const _ = require('lodash');
const intoStream = require('into-stream');

const models = require('../models');
const shared = require('./shared.js');
const jsonSchema = require('../lib/json-schema');

exports.getSurvey = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    models.survey.getSurvey(id, options)
        .then(survey => res.status(200).json(survey))
        .catch(shared.handleError(res));
};

exports.createSurvey = function (req, res) {
    if (!jsonSchema('newSurvey', req.body, res)) {
        return;
    }
    models.survey.createOrReplaceSurvey(req.body)
        .then(id => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.patchSurveyText = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    models.survey.patchSurveyText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.patchSurvey = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.survey.patchSurvey(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteSurvey = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.survey.deleteSurvey(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listSurveys = function (req, res) {
    const scope = _.get(req, 'swagger.params.scope.value');
    const language = _.get(req, 'swagger.params.language.value');
    const status = _.get(req, 'swagger.params.status.value');
    const options = { scope, language, status };
    models.survey.listSurveys(options)
        .then(surveys => res.status(200).json(surveys))
        .catch(shared.handleError(res));
};

exports.getAnsweredSurvey = function (req, res) {
    const userId = req.user.id;
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    models.survey.getAnsweredSurvey(userId, id, options)
        .then(survey => res.status(200).json(survey))
        .catch(shared.handleError(res));
};

exports.exportSurveys = function (req, res) {
    models.survey.export()
        .then(csvContent => {
            res.header('Content-disposition', 'attachment; filename=survey.csv');
            res.type('text/csv');
            res.status(200).send(csvContent);
        })
        .catch(shared.handleError(res));
};

exports.importSurveys = function (req, res) {
    const csvFile = _.get(req, 'swagger.params.surveycsv.value');
    const idMapAsString = _.get(req, 'swagger.params.questionidmap.value');
    const idMap = JSON.parse(idMapAsString);
    const stream = intoStream(csvFile.buffer);
    models.survey.import(stream, idMap)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.searchSurvey = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const query = _.get(req, 'swagger.params.query.value');
    models.survey.searchCountUsers(id, query)
        .then(count => res.status(200).json({ count: count }))
        .catch(shared.handleError(res));
};
