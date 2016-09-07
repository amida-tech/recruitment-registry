'use strict';

const passport = require('passport');
const passportHttp = require('passport-http');

const models = require('../../models');

const User = models.User;

const basicStrategy = function (username, password, done) {
    User.findOne({
        where: {
            username
        }
    }).then(user => {
        if (user) {
            user.authenticate(password, function (err, result) {
                if (err) {
                    return done(err);
                }
                if (result) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        } else {
            return done(null, false);
        }
    });
};

exports.init = function () {
    passport.use(new passportHttp.BasicStrategy(basicStrategy));
};
