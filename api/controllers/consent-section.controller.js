'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const ConsentSection = models.ConsentSection;

exports.createConsentSection = function (req, res) {
    const typeId = _.get(req, 'swagger.params.typeId.value');
    const content = _.get(req, 'swagger.params.content.value');
    ConsentSection.createConsentSection(Object.assign({ typeId }, content))
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.getContent = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    ConsentSection.getContent(id)
        .then(content => res.status(200).json(content))
        .catch(shared.handleError(res));
};
