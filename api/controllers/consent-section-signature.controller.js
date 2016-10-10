'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const ConsentSectionSignature = models.ConsentSectionSignature;

exports.createSignature = function (req, res) {
    const { consentSectionId } = _.get(req, 'swagger.params.consent_section.value');
    ConsentSectionSignature.createSignature(req.user.id, consentSectionId)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};
