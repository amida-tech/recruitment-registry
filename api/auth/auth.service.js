'use strict';

const config = require('../config');

const passport = require('passport');

const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

const models = require('../models');

const User = models.User;

const jwtStrategy = function (jwtPayload, done) {
    User.findOne({
        where: {
            id: jwtPayload.id,
            username: jwtPayload.username
        },
        attributes: {
            exclude: [
                'createdAt', 'updatedAt', 'password'
            ]
        }
    }).then(user => {
        if (user) {
            user = user.get(undefined, {
                plain: true
            });
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
};

exports.init = function () {
    const JWTOptions = {
        jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme('Bearer'),
        secretOrKey: config.jwt.secret
    };
    passport.use(new JWTStrategy(JWTOptions, jwtStrategy));
};

exports.isAuthenticated = function () {
    return passport.authenticate('jwt', {
        session: false
    });
};
