'use strict';

const _ = require('lodash');
const intoStream = require('into-stream');

const shared = require('./shared.js');

exports.createAnswers = function createAnswers(req, res) {
    const answers = req.body;
    answers.userId = req.user.id;
    req.models.answer.createAnswers(answers)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getAnswers = function getAnswers(req, res) {
    const surveyId = _.get(req, 'swagger.params.survey-id.value');
    const userId = req.user.id;
    req.models.answer.getAnswers({ userId, surveyId })
        .then(answers => res.status(200).json(answers))
        .catch(shared.handleError(res));
};

exports.exportAnswers = function exportAnswers(req, res) {
    const userId = req.user.id;
    req.models.answer.exportForUser(userId)
        .then((csvContent) => {
            res.header('Content-disposition', 'attachment; filename=answer.csv');
            res.type('text/csv');
            res.status(200).send(csvContent);
        })
        .catch(shared.handleError(res));
};

exports.exportMultiUserAnswers = function exportMultiUserAnswers(req, res) {
    const userIds = _.get(req, 'swagger.params.user-ids.value');
    req.models.answer.exportForUsers(userIds)
        .then((csvContent) => {
            res.header('Content-disposition', 'attachment; filename=answer.csv');
            res.type('text/csv');
            res.status(200).send(csvContent);
        })
        .catch(shared.handleError(res));
};

exports.importAnswers = function importAnswers(req, res) {
    const userId = req.user.id;
    const csvFile = _.get(req, 'swagger.params.answercsv.value');
    const questionIdMapAsString = _.get(req, 'swagger.params.questionidmap.value');
    const surveyIdMapAsString = _.get(req, 'swagger.params.surveyidmap.value');
    const questionIdMap = JSON.parse(questionIdMapAsString);
    const surveyIdMap = JSON.parse(surveyIdMapAsString);
    const stream = intoStream(csvFile.buffer);
    const maps = { userId, surveyIdMap, questionIdMap };
    req.models.answer.importAnswers(stream, maps)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.importMultiUserAnswers = function importMultiUserAnswers(req, res) {
    const csvFile = _.get(req, 'swagger.params.answercsv.value');
    const questionIdMapAsString = _.get(req, 'swagger.params.questionidmap.value');
    const surveyIdMapAsString = _.get(req, 'swagger.params.surveyidmap.value');
    const userIdMapAsString = _.get(req, 'swagger.params.useridmap.value');
    const questionIdMap = JSON.parse(questionIdMapAsString);
    const surveyIdMap = JSON.parse(surveyIdMapAsString);
    const userIdMap = JSON.parse(userIdMapAsString);
    const stream = intoStream(csvFile.buffer);
    const maps = { userIdMap, surveyIdMap, questionIdMap };
    req.models.answer.importAnswers(stream, maps)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listAnswersExport = function listAnswersExport(req, res) {
    const userId = req.user.id;
    req.models.answer.listAnswers({ scope: 'export', userId })
        .then(answers => res.status(200).json(answers))
        .catch(shared.handleError(res));
};

exports.listAnswersMultiUserExport = function listAnswersMultiUserExport(req, res) {
    const userIds = _.get(req, 'swagger.params.user-ids.value');
    req.models.answer.listAnswers({ scope: 'export', userIds })
        .then(answers => res.status(200).json(answers))
        .catch(shared.handleError(res));
};

exports.searchAnswers = function searchAnswers(req, res) {
    const query = _.get(req, 'swagger.params.query.value');
    req.models.answer.countParticipants(query)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.countParticipantsIdentifiers = function countParticipantsIdentifiers(req, res) {
    const query = _.get(req, 'swagger.params.query.value');
    req.models.answer.countParticipantsIdentifiers(query)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.searchParticipants = function searchParticipants(req, res) {
    const query = _.get(req, 'swagger.params.query.value');
    req.models.answer.searchParticipants(query)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.searchParticipantsIdentifiers = function searchParticipantsIdentifiers(req, res) {
    const query = _.get(req, 'swagger.params.query.value');
    req.models.answer.searchParticipantsIdentifiers(query)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.federatedSearchAnswers = function federatedSearchAnswers(req, res) {
    const query = _.get(req, 'swagger.params.query.value');
    const allModels = req.app.locals.models;
    req.models.answer.federatedCountParticipants(allModels, query)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.federatedListParticipants = function federatedListParticipants(req, res) {
    const query = _.get(req, 'swagger.params.query.value');
    req.models.answer.federatedListParticipants(query)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

