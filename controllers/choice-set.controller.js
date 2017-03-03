'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.createChoiceSet = function (req, res) {
    models.choiceSet.createChoiceSet(req.body)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.deleteChoiceSet = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.choiceSet.deleteChoiceSet(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getChoiceSet = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const language = _.get(req, 'swagger.params.language.value');
    models.choiceSet.getChoiceSet(id, language)
        .then(choiceSet => res.status(200).json(choiceSet))
        .catch(shared.handleError(res));
};

exports.listChoiceSets = function (req, res) {
    models.choiceSet.listChoiceSets()
        .then(choiceSets => res.status(200).json(choiceSets))
        .catch(shared.handleError(res));
};
