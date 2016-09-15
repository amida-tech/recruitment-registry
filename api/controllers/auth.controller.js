'use strict';

const passport = require('passport');
const passportHttp = require('passport-http');
const jwt = require('jsonwebtoken');

const config = require('../config');
const models = require('../models');

const User = models.User;

const basicStrategy = function (username, password, done) {
    User.findOne({
        where: {
            username
        }
    }).then(function (user) {
        if (user) {
            return user.authenticate(password).then(function () {
                done(null, user);
            }).catch(function (err) {
                done(err);
            });
        } else {
            return done(null, false);
        }
    });
};

exports.init = function () {
    passport.use(new passportHttp.BasicStrategy(basicStrategy));
};

exports.init();

const createJWT = function (payload) {
    const options = {
        expiresIn: "30d"
    };
    // replace 'development' with process ENV.
    return jwt.sign(payload, config.jwt.secret, options);
};

const createUserJWT = function (user) {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role
    };
    return createJWT(payload);
};

const authenticate = passport.authenticate('basic', {
    session: false
});

const sendToken = function (req, res) {
    const token = createUserJWT(req.user);
    if (token) {
        res.status(200).json({
            token
        }); // This is for development. We will probably want to return as a cookie.
    } else {
        console.log("Error producing JWT: ", token);
        res.status(400);
    }
};

exports.authenticateBasic = function (req, res, next) {
    authenticate(req, res, function (err) {
        if (err) {
            res.status(401);
            return next(err);
        }
        sendToken(req, res);
    });
};
