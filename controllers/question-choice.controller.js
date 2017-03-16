'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.deleteQuestionChoice = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.questionChoice.deleteQuestionChoice(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.updateMultipleChoiceTexts = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    req.models.questionChoice.updateMultipleChoiceTexts(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
