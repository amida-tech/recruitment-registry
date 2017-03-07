'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const sendMail = require('../lib/email');

exports.createNewUser = function (req, res) {
    const newUser = req.body;
    if (!newUser.role) {
        newUser.role = 'participant';
    }
    return models.user.createUser(newUser)
        .then(({ id }) => {
            sendMail(newUser, 'new_contact', {});
            res.status(201).json({ id });
        })
        .catch(shared.handleError(res));
};

exports.getUser = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.user.getUser(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.patchUser = function (req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    models.user.updateUser(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listUsers = function (req, res) {
    const role = _.get(req, 'swagger.params.role.value');
    const options = role ? { role } : {};
    models.user.listUsers(options)
        .then(users => res.status(200).json(users))
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
