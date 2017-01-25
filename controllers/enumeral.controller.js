'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.deleteEnumeral = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.enumeral.deleteEnumeral(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.updateEnumeralTexts = function (req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    models.enumeral.updateEnumeralTexts(req.body, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
