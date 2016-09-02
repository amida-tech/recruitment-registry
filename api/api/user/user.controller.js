'use strict';

const jwt = require('jsonwebtoken');

const config = require('../../config');
const db = require('../../db');

const User = db.User;
const Ethnicity = db.Ethnicity;

// Create standalone functions for callbacks of each async request.
const createUserIfNonExistent = (res, req) => {
    const username = req.body.username;
    User.findOne({
        where: {
            username
        }
    }).then(data => {
        if (data) {
            res.status(400).send('An existing user has already used that username address.');
        } else {
            User.create(req.body).then(user => {
                res.status(201).json({
                    id: user.id,
                    username: user.username
                });
            });
        }
    });
};

const userController = {
    createNewUser: (req, res) => {
        createUserIfNonExistent(res, req);
    },
    showCurrentUser: (req, res) => {
        if (req.user) {
            const currentUser = {
                username: req.user.username,
                email: req.user.email,
                zip: req.user.zip
            };
            res.status(200).json(currentUser);
        } else {
            res.status(401);
        }
    },
    getEthnicities: function (req, res) {
        const result = Ethnicity.ethnicities();
        res.status(200).json(result);
    },
    getGenders: function (req, res) {
        const result = User.genders();
        res.status(200).json(result);
    },
    register: function (req, res) {
        User.register(req.body).then(function (id) {
            res.status(201).json({
                id
            });
        }).catch(function (err) {
            res.status(401).send(err);
        });
    },
    meAndSurvey: function (req, res) {
        const input = {
            userId: req.user.id,
            surveyName: req.params.name
        };
        User.showWithSurvey(input).then(function (result) {
            res.status(200).json(result);
        }).catch(function (err) {
            res.status(400).send(err);
        });
    }
};

module.exports = userController;
