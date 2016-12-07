'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');
const jsonSchema = require('../lib/json-schema');

exports.createQuestion = function (req, res) {
    if (!jsonSchema('newQuestion', req.body, res)) {
        return;
    }
    const question = _.omit(req.body, 'parentId');
    const parentId = req.body.parentId;
    if (parentId) {
        models.question.replaceQuestion(parentId, question)
            .then(result => res.status(201).json(result))
            .catch(shared.handleError(res));
    } else {
        models.question.createQuestion(question)
            .then(id => res.status(201).json({ id }))
            .catch(shared.handleError(res));
    }
};

exports.updateQuestionText = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    models.question.updateQuestionText(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteQuestion = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.question.deleteQuestion(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getQuestion = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = language ? { language } : {};
    models.question.getQuestion(id, options)
        .then(question => res.status(200).json(question))
        .catch(shared.handleError(res));
};

exports.listQuestions = function (req, res) {
    const scope = _.get(req, 'swagger.params.scope.value');
    const language = _.get(req, 'swagger.params.language.value');
    const options = { scope, language };
    models.question.listQuestions(options)
        .then(questions => res.status(200).json(questions))
        .catch(shared.handleError(res));
};

exports.exportQuestions = function (req, res) {
    models.question.export()
        .then(csvContent => {
            res.header('Content-disposition', 'attachment; filename=question.csv');
            res.type('text/csv');
            res.status(200).send(csvContent);
        })
        .catch(shared.handleError(res));
};

exports.importQuestions = function (req, res) {
    console.log('=================');
    console.log(req);
    res.status(201).json({});
    //models.question.export()
    //    .then(csvContent => {
    //        res.header('Content-disposition', 'attachment; filename=question.csv');
    //        res.type('text/csv');
    //        res.status(200).send(csvContent);
    //    })
    //    .catch(shared.handleError(res));
};
