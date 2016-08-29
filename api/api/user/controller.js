'use strict';

const jwt = require('jsonwebtoken');

const config = require('../../config');
const db = require('../../db');

const User = db.User;

// Create standalone functions for callbacks of each async request.
const createUserIfNonExistent = (res, email, password) => {
    User.findOne({
        where: {
            email
        }
    }).then(data => {
        if (data) {
            res.status(400).send('An existing user has already used that email address.');
        } else {
            User.create({
                email,
                password,
                admin: false
            }).then(user => {
                res.status(201).json({
                    id: user.id,
                    email: user.email
                });
            });
        }
    });
};

const userController = {
    createNewUser: (req, res) => {
        createUserIfNonExistent(res, req.body.email, req.body.password);
    },
    showCurrentUser: (req, res) => {
        if (req.user) {
            const currentUser = {
                email: req.user.email,
                admin: req.user.admin
            };
            res.status(200).json(currentUser);
        } else {
            res.status(401);
        }
    },
    createToken: function(req, res) {
        const token = createUserJWT(req.user);
        if (token) {
            res.status(200).json({
                token
            }); // This is for development. We will probably want to return as a cookie.
        } else {
            console.log("Error producing JWT: ", token);
            res.status(400);
        }
    }
};

function createJWT(payload) {
    const options = {
        expiresIn: "30d"
    };
    // replace 'development' with process ENV.
    return jwt.sign(payload, config.jwt.secret, options);
}

function createUserJWT(user) {
    const payload = {
        id: user.id,
        email: user.email,
        admin: user.admin
    };
    return createJWT(payload);
}

module.exports = userController;