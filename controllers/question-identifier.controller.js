'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.getQuestionIdByIdentifier = function getQuestionIdByIdentifier(req, res) {
    const type = _.get(req, 'swagger.params.type.value');
    const identifier = _.get(req, 'swagger.params.identifier.value');
    req.models.questionIdentifier.getQuestionIdByIdentifier(type, identifier)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
