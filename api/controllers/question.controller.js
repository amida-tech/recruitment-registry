'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');
const jsonSchema = require('../lib/json-schema');

const Question = models.Question;

exports.createQuestion = function (req, res) {
    const question = req.body;
    if (!jsonSchema('newQuestion', question, res)) {
        return;
    }
    const parent = _.get(req, 'swagger.params.parent.value');
    if (parent) {
        Question.replaceQuestion(parent, question)
            .then(result => res.status(201).json(result))
            .catch(shared.handleError(res));
    } else {
        Question.createQuestion(question)
            .then(id => res.status(201).json({ id }))
            .catch(shared.handleError(res));
    }
};

exports.updateQuestion = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Question.updateQuestion(id, req.body)
        .then(() => res.status(204).json({}))
        .catch(shared.handleError(res));
};

exports.deleteQuestion = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Question.deleteQuestion(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getQuestion = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Question.getQuestion(id)
        .then((question) => res.status(200).json(question))
        .catch(shared.handleError(res));
};

exports.getAllQuestions = function (req, res) {
    Question.getAllQuestions()
        .then((questions) => res.status(200).json(questions))
        .catch(shared.handleError(res));
};
