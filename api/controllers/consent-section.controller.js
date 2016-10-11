'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const ConsentSection = models.ConsentSection;

exports.createConsentSection = function (req, res) {
    ConsentSection.createConsentSection(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getConsentSection = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    ConsentSection.getConsentSection(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
