'use strict';

const _ = require('lodash');
const intoStream = require('into-stream');

const shared = require('./shared.js');
const jsonSchema = require('../lib/json-schema');

exports.createQuestion = function createQuestion(req, res) {
    if (!jsonSchema('newQuestion', req.body, res)) {
        return;
    }
    const question = _.omit(req.body, 'parentId');
    const parentId = req.body.parentId;
    if (parentId) {
        req.models.question.replaceQuestion(parentId, question)
            .then(result => res.status(201).json(result))
            .catch(shared.handleError(res));
    } else {
        req.models.question.createQuestion(question)
            .then(({ id }) => res.status(201).json({ id }))
            .catch(shared.handleError(res));
    }
};

exports.updateQuestionText = function updateQuestionText(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    req.models.question.updateQuestionText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteQuestion = function deleteQuestion(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.question.deleteQuestion(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getQuestion = function getQuestion(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const federated = _.get(req, 'swagger.params.federated.value');
    const options = { federated };
    if (language) {
        options.language = language;
    }
    req.models.question.getQuestion(id, options)
        .then(question => res.status(200).json(question))
        .catch(shared.handleError(res));
};

exports.listQuestions = function listQuestions(req, res) {
    const scope = _.get(req, 'swagger.params.scope.value');
    const language = _.get(req, 'swagger.params.language.value');
    const surveyId = _.get(req, 'swagger.params.survey-id.value');
    const commonOnly = _.get(req, 'swagger.params.common-only.value');
    const federated = _.get(req, 'swagger.params.federated.value');
    const options = { scope, language, surveyId, commonOnly, federated };
    req.models.question.listQuestions(options)
        .then(questions => res.status(200).json(questions))
        .catch(shared.handleError(res));
};

exports.addQuestionIdentifiers = function addQuestionIdentifiers(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.question.addQuestionIdentifiers(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.exportQuestions = function exportQuestions(req, res) {
    req.models.question.exportQuestions()
        .then((csvContent) => {
            res.header('Content-disposition', 'attachment; filename=question.csv');
            res.type('text/csv');
            res.status(200).send(csvContent);
        })
        .catch(shared.handleError(res));
};

exports.importQuestions = function importQuestions(req, res) {
    const csvFile = _.get(req, 'swagger.params.questioncsv.value');
    const stream = intoStream(csvFile.buffer);
    req.models.question.importQuestions(stream)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};
