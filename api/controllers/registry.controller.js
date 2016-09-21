'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const Registry = models.Registry;

exports.createRegistry = function (req, res) {
    Registry.createRegistry(req.body)
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getRegistry = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    Registry.getRegistry(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getRegistryByName = function (req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    Registry.getRegistryByName(name)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.getRegistryProfileSurvey = function (req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    Registry.getRegistryProfileSurvey(name)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.createProfile = function (req, res) {
    Registry.createProfile(req.body)
        .then(tokenObj => res.status(201).json(tokenObj))
        .catch(shared.handleError(res));
};

exports.updateProfile = function (req, res) {
    Registry.updateProfile(req.user.id, req.body)
        .then(() => res.status(200).json({}))
        .catch(shared.handleError(res));
};

exports.getProfile = function (req, res) {
    Registry.getProfile({ userId: req.user.id })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
