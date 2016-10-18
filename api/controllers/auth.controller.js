'use strict';

const passport = require('passport');
const passportHttp = require('passport-http');

const models = require('../models');
const tokener = require('../lib/tokener');
const jsutil = require('../lib/jsutil');

const User = models.User;

const basicStrategy = function (username, password, done) {
    User.findOne({ where: { username } })
        .then(function (user) {
            if (user) {
                return user.authenticate(password)
                    .then(() => done(null, user))
                    .catch(err => done(err));
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
    session: false,
    failWithError: true
});

exports.authenticateBasic = function (req, res) {
    authenticate(req, res, function (err) {
        if (err) {
            err = jsutil.errToJSON(err);
            return res.status(401).json(err);
        }
        const token = tokener.createJWT(req.user);
        res.status(200).json({ token }); // This is for development. We will probably want to return as a cookie.
    });
};
