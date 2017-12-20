'use strict';

const _ = require('lodash');
const intoStream = require('into-stream');

const shared = require('./shared.js');
const jsonSchema = require('../lib/json-schema');

exports.getSurvey = function getSurvey(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    options.isIdentifying = true;
    options.admin = (req.user.role === 'admin');
    req.models.survey.getSurvey(id, options)
        .then(survey => res.status(200).json(survey))
        .catch(shared.handleError(res));
};

exports.createSurvey = function createSurvey(req, res) {
    if (!jsonSchema('newSurvey', req.body, res)) {
        return;
    }
    const userId = req.user.id;
    req.models.survey.createOrReplaceSurvey(req.body, userId)
        .then(id => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.patchSurveyText = function patchSurveyText(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    req.models.survey.patchSurveyText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.patchSurvey = function patchSurvey(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.survey.patchSurvey(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteSurvey = function deleteSurvey(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.survey.deleteSurvey(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listSurveys = function listSurveys(req, res) {
    const scope = _.get(req, 'swagger.params.scope.value');
    const language = _.get(req, 'swagger.params.language.value');
    const status = _.get(req, 'swagger.params.status.value');
    const options = { scope, language, status };
    options.admin = (req.user.role === 'admin');
    req.models.survey.listSurveys(options)
        .then(surveys => res.status(200).json(surveys))
        .catch(shared.handleError(res));
};

exports.getAnsweredSurvey = function getAnsweredSurvey(req, res) {
    const userId = req.user.id;
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    const isIdentifying = _.get(req, 'swagger.params.isIdentifying.value');
    if(!isIdentifying){
      options.isIdentifying = false;
    }else{
      options.isIdentifying = true;
    }
    options.admin = (req.user.role === 'admin');
    req.models.survey.getAnsweredSurvey(userId, id, options)
        .then(survey => res.status(200).json(survey))
        .catch(shared.handleError(res));
};

exports.exportSurveys = function exportSurveys(req, res) {
    req.models.survey.exportSurveys()
        .then((csvContent) => {
            res.header('Content-disposition', 'attachment; filename=survey.csv');
            res.type('text/csv');
            res.status(200).send(csvContent);
        })
        .catch(shared.handleError(res));
};

exports.importSurveys = function importSurveys(req, res) {
    const csvFile = _.get(req, 'swagger.params.surveycsv.value');
    const idMapAsString = _.get(req, 'swagger.params.questionidmap.value');
    const idMap = JSON.parse(idMapAsString);
    const stream = intoStream(csvFile.buffer);
    req.models.survey.importSurveys(stream, { questionIdMap: idMap })
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};
