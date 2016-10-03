'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const User = models.User;

exports.createNewUser = function (req, res) {
    const username = req.body.username;
    User.findOne({ where: { username } })
        .then(data => {
            if (data) {
                return res.status(400).json({
                    message: 'An existing user has already used that username address.'
                });
            } else {
                const newUser = req.body;
                newUser.role = 'participant';
                return User.create(req.body)
                    .then(user => {
                        return res.status(201).json({
                            id: user.id,
                            username: user.username,
                            role: user.role
                        });
                    });
            }
        })
        .catch(shared.handleError(res));
};

exports.showCurrentUser = function (req, res) {
    if (req.user) {
        const currentUser = _.omitBy(req.user, _.isNil);
        res.status(200).json(currentUser);
    } else {
        res.status(401).json({});
    }
};

exports.updateCurrentUser = function (req, res) {
    if (req.user) {
        User.updateUser(req.user.id, req.body)
            .then(() => res.status(200).json({}))
            .catch(shared.handleError(res));
    } else {
        res.status(401).json({});
    }
};

exports.resetPassword = function (req, res) {
    User.resetPassword(req.body.token, req.body.password)
        .then(() => res.status(201).json({}))
        .catch(shared.handleError(res));
};

exports.listDocuments = function (req, res) {
    User.listDocuments(req.user.id)
        .then(documents => res.status(200).json(documents))
        .catch(shared.handleError(res));
};
