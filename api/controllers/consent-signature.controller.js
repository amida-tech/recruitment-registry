'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const ConsentSignature = models.ConsentSignature;

exports.createSignature = function (req, res) {
    const { consentDocumentId } = _.get(req, 'swagger.params.consent_document.value');
    ConsentSignature.createSignature(req.user.id, consentDocumentId)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};
