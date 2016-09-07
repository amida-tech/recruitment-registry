'use strict';

const models = require('../../models');

const User = models.User;

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
    }
};

module.exports = userController;
