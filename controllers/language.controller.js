'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const language = models.language;

exports.createLanguage = function (req, res) {
    language.createLanguage(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getLanguage = function (req, res) {
    const code = _.get(req, 'swagger.params.code.value');
    language.getLanguage(code)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.patchLanguage = function (req, res) {
    const code = _.get(req, 'swagger.params.code.value');
    language.patchLanguage(code, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteLanguage = function (req, res) {
    const code = _.get(req, 'swagger.params.code.value');
    language.deleteLanguage(code)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listLanguages = function (req, res) {
    language.listLanguages()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
