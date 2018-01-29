'use strict';

const _ = require('lodash');
const shared = require('./shared.js');

exports.listDemographics = function listDemographics(req, res) {
    const language = _.get(req, 'swagger.params.language.value');
    const options = { language };
    req.models.demographics.listDemographics(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
