'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const User = models.User;

exports.createProfile = function (req, res) {
    User.register(req.body)
        .then(tokenObj => res.status(201).json(tokenObj))
        .catch(shared.handleError(res));
};

exports.updateProfile = function (req, res) {
    User.updateRegister(req.user.id, req.body)
        .then(() => res.status(200).json({}))
        .catch(shared.handleError(res));
};

exports.getProfile = function (req, res) {
    const name = _.get(req, 'swagger.params.registryName.value');
    const input = {
        userId: req.user.id,
        surveyName: name
    };
    User.showWithSurvey(input)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
