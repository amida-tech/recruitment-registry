'use strict';

const passport = require('passport');
const passportHttp = require('passport-http');

const db = require('../models/db');
const tokener = require('../lib/tokener');
const jsutil = require('../lib/jsutil');

const basicStrategy = function (username, password, done) {
    db.User.findOne({ where: { username } })
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

passport.use(new passportHttp.BasicStrategy(basicStrategy));

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
        res.cookie('rr-jwt-token', token);
        res.status(200).json({});
    });
};
