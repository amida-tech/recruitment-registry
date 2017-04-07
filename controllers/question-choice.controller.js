'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createQuestionChoice = function createQuestionChoice(req, res) {
    const questionChoice = _.get(req, 'swagger.params.newQuestionChoice.value');
    req.models.questionChoice.createQuestionChoice(questionChoice)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.deleteQuestionChoice = function deleteQuestionChoice(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.questionChoice.deleteQuestionChoice(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.patchQuestionChoice = function patchQuestionChoice(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const patch = _.get(req, 'swagger.params.questionChoicePatch.value');
    req.models.questionChoice.patchQuestionChoice(id, patch)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.updateMultipleChoiceTexts = function updateMultipleChoiceTexts(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    req.models.questionChoice.updateMultipleChoiceTexts(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
