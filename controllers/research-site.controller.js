'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

exports.createResearchSite = function (req, res) {
    models.researchSite.createResearchSite(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getResearchSite = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.researchSite.getResearchSite(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.patchResearchSite = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.researchSite.patchResearchSite(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.deleteResearchSite = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.researchSite.deleteResearchSite(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listResearchSites = function (req, res) {
    const nearZip = _.get(req, 'swagger.params.near-zip.value');
    const options = nearZip ? { nearZip } : {};
    models.researchSite.listResearchSites(options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.createResearchSiteVicinity = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    const zipCodes = req.body.zipCodes;
    models.researchSite.createResearchSiteVicinity(id, zipCodes)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
