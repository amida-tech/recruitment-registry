'use strict';

const config = require('../config');

const jwt = require('jsonwebtoken');
const _ = require('lodash');

const models = require('../models');

const invalidAuth = {
    message: 'Invalid authorization',
    code: 'invalid_auth',
    statusCode: 401
};

const noAuth = {
    message: 'No authorization',
    code: 'no_auth',
    statusCode: 401
};

const invalidUser = {
    message: 'Invalid user',
    code: 'invalid_user',
    statusCode: 403
};

const unauthorizedUser = {
    message: 'Unauthorized user',
    code: 'unauth_user',
    statusCode: 403
};

const jwtAuth = function (req, header, verifyUserFn, callback) {
    if (header) {
        const matches = header.match(/(\S+)\s+(\S+)/);
        if (matches && matches[1] === 'Bearer') {
            const token = matches[2];
            return jwt.verify(token, config.jwt.secret, {}, function (err, payload) {
                if (err) {
                    return callback(invalidAuth);
                }
                models.user.getUser(payload.id)
                    .then(user => {
                        if (user) {
                            if (user.username !== payload.username) {
                                return callback(invalidUser);
                            }
                            let err = verifyUserFn(user);
                            req.user = user;
                            return callback(err);
                        } else {
                            return callback(invalidUser);
                        }
                    });
            });
        } else {
            return callback(invalidAuth);
        }
    }
    callback(noAuth);
};

const roleCheck = function (role) {
    return function (user) {
        if (user.role === role) {
            return null;
        }
        return unauthorizedUser;
    };
};

const rolesCheck = function (roles) {
    return function (user) {
        if (roles.indexOf(user.role) >= 0) {
            return null;
        }
        return unauthorizedUser;
    };
};

module.exports = {
    invalidAuth,
    noAuth,
    invalidUser,
    unauthorizedUser,
    participant(req, def, header, callback) {
        jwtAuth(req, header, rolesCheck(['participant', 'admin']), callback);
    },
    admin(req, def, header, callback) {
        jwtAuth(req, header, roleCheck('admin'), callback);
    },
    self(req, def, header, callback) {
        jwtAuth(req, header, _.constant(null), callback);
    }
};
