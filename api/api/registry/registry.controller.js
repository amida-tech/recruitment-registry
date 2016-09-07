'use strict';

const models = require('../../models');

const User = models.User;

exports.createProfile = function (req, res) {
    User.register(req.body).then(function (id) {
        res.status(201).json({
            id
        });
    }).catch(function (err) {
        res.status(401).send(err);
    });
};

exports.getProfile = function (req, res) {
    const input = {
        userId: req.user.id,
        surveyName: req.params.name
    };
    User.showWithSurvey(input).then(function (result) {
        res.status(200).json(result);
    }).catch(function (err) {
        res.status(400).send(err);
    });
};
