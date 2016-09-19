'use strict';

const _ = require('lodash');

const models = require('../models');

const User = models.User;

exports.createNewUser = function (req, res, next) {
    const username = req.body.username;
    User.findOne({
        where: {
            username
        }
    }).then(data => {
        if (data) {
            return res.status(400).json({
                message: 'An existing user has already used that username address.'
            });
        } else {
            const newUser = req.body;
            newUser.role = 'participant';
            return User.create(req.body).then(user => {
                return res.status(201).json({
                    id: user.id,
                    username: user.username,
                    role: user.role
                });
            });
        }
    }).catch(function (err) {
        next(err);
    });
};

exports.showCurrentUser = function (req, res) {
    if (req.user) {
        const currentUser = _.omitBy(req.user, _.isNil);
        res.status(200).json(currentUser);
    } else {
        res.status(401).json({});
    }
};

exports.updateCurrentUser = function (req, res, next) {
    if (req.user) {
        User.updateUser(req.user.id, req.body).then(function () {
            res.status(200).json({});
        }).catch(function (err) {
            res.status(422);
            next(err);
        });
    } else {
        res.status(401).json({});
    }
};

exports.resetPassword = function (req, res, next) {
    User.resetPassword(req.body.token, req.body.password).then(function () {
        res.status(201).json({});
    }).catch(function (err) {
        res.status(401);
        next(err);
    });
};
