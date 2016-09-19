'use strict';

const passport = require('passport');
const passportHttp = require('passport-http');

const models = require('../models');
const tokener = require('../lib/tokener');

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

const authenticate = passport.authenticate('basic', {
    session: false
});

const sendToken = function (req, res) {
    const token = tokener.createJWT(req.user);
    if (token) {
        res.status(200).json({
            token
        }); // This is for development. We will probably want to return as a cookie.
    } else {
        res.status(400).json({
            message: 'Unexpected error.'
        });
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
