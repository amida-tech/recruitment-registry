'use strict';

const passport = require('passport');
const passportHttp = require('passport-http');

const tokener = require('../lib/tokener');
const shared = require('./shared.js');

const basicStrategy = function (req, username, password, done) {
    req.models.auth.authenticateUser(username, password)
        .then(user => done(null, user))
        .catch(err => done(err));
};

passport.use(new passportHttp.BasicStrategy({ passReqToCallback: true }, basicStrategy));

const authenticate = passport.authenticate('basic', {
    session: false,
    failWithError: true,
});

exports.authenticateBasic = function authenticateBasic(req, res) {
    authenticate(req, res, (err) => {
        if (err) {
            const json = shared.errToJSON(err, res);
            return res.status(401).json(json);
        }
        const token = tokener.createJWT(req.user);
        res.cookie('rr-jwt-token', token, { httpOnly: true });
        return res.status(200).json({});
    });
};
