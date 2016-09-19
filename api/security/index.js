'use strict';

const config = require('../config');

const jwt = require('jsonwebtoken');
const _ = require('lodash');

const models = require('../models');

const User = models.User;

const jwtAuth = function (req, header, verifyUserFn, callback) {
    if (header) {
        const matches = header.match(/(\S+)\s+(\S+)/);
        if (matches && matches[1] === 'Bearer') {
            const token = matches[2];
            if (token) {
                return jwt.verify(token, config.jwt.secret, {}, function (err, payload) {
                    if (err) {
                        err.statusCode = 401;
                        return callback({
                            message: 'Invalid authorization',
                            code: 'invalid_auth',
                            statusCode: 401
                        });
                    }
                    User.findOne({
                        where: {
                            id: payload.id,
                            username: payload.username
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
                            let err = verifyUserFn(user);
                            req.user = user;
                            return callback(err);
                        } else {
                            let err = {
                                message: 'Invalid user',
                                code: 'invalid_user',
                                statusCode: 403
                            };
                            return callback(err);
                        }
                    });
                });
            }
        } else {
            return callback({
                message: 'Invalid authorization',
                code: 'invalid_auth',
                statusCode: 401
            });
        }
    }
    let err = {
        message: 'No authorization',
        code: 'no_auth',
        statusCode: 401
    };
    callback(err);
};

const roleCheck = function (role) {
    return function (user) {
        if (user.role === role) {
            return null;
        }
        return {
            message: 'Unauthorized user',
            code: 'unauth_user',
            statusCode: 403
        };
    };
};

const rolesCheck = function (roles) {
    return function (user) {
        if (roles.indexOf(user.role) >= 0) {
            return null;
        }
        return {
            message: 'Unauthorized user',
            code: 'unauth_user',
            statusCode: 403
        };
    };
};

module.exports = {
    participant: function (req, def, header, callback) {
        jwtAuth(req, header, rolesCheck(['participant', 'admin']), callback);
    },
    admin: function (req, def, header, callback) {
        jwtAuth(req, header, roleCheck('admin'), callback);
    },
    self: function (req, def, header, callback) {
        jwtAuth(req, header, _.constant(null), callback);
    }
};
