'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.getQuestionIdByIdentifier = function (req, res) {
    const type = _.get(req, 'swagger.params.type.value');
    const identifier = _.get(req, 'swagger.params.identifier.value');
    models.questionIdentifier.getQuestionIdByIdentifier(type, identifier)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
