'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');
const tokener = require('../lib/tokener');

exports.createNewUser = function (req, res) {
    const newUser = Object.assign({ role: 'participant' }, req.body);
    return models.user.createUser(newUser)
        .then(user => {
            const token = tokener.createJWT(user);
            res.cookie('rr-jwt-token', token);
            res.status(201).json({ id: user.id });
        })
        .catch(shared.handleError(res));
};

exports.showCurrentUser = function (req, res) {
    const currentUser = _.omitBy(req.user, _.isNil);
    res.status(200).json(currentUser);
};

exports.updateCurrentUser = function (req, res) {
    models.user.updateUser(req.user.id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.resetPassword = function (req, res) {
    models.user.resetPassword(req.body.token, req.body.password)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
