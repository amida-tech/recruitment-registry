'use strict';

const _ = require('lodash');

const models = require('../models');

const User = models.User;

exports.createProfile = function (req, res) {
    User.register(req.body)
        .then(tokenObj => res.status(201).json(tokenObj))
        .catch(err => res.status(401).send(err));
};

exports.updateProfile = function (req, res) {
    User.updateRegister(req.user.id, req.body).then(function () {
        res.status(200).json({});
    }).catch(function (err) {
        res.status(422).send(err);
    });
};

exports.getProfile = function (req, res) {
    const name = _.get(req, 'swagger.params.registryName.value');
    const input = {
        userId: req.user.id,
        surveyName: name
    };
    User.showWithSurvey(input).then(function (result) {
        res.status(200).json(result);
    }).catch(function (err) {
        res.status(400).send(err);
    });
};
