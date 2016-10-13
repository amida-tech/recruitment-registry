'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const Language = models.Language;

exports.createLanguage = function (req, res) {
    Language.createLanguage(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getLanguage = function (req, res) {
    const code = _.get(req, 'swagger.params.code.value');
    Language.getLanguage(code)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.patchLanguage = function (req, res) {
    const code = _.get(req, 'swagger.params.code.value');
    Language.patchLanguage(code, req.body)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.deleteLanguage = function (req, res) {
    const code = _.get(req, 'swagger.params.code.value');
    Language.deleteLanguage(code)
        .then(result => res.status(204).json(result))
        .catch(shared.handleError(res));
};

exports.listLanguages = function (req, res) {
    Language.listLanguages()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
