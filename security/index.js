'use strict';

const config = require('../config');

const jwt = require('jsonwebtoken');
const _ = require('lodash');

const invalidAuth = {
    message: 'Invalid authorization',
    code: 'invalid_auth',
    statusCode: 401,
};

const noAuth = {
    message: 'No authorization',
    code: 'no_auth',
    statusCode: 401,
};

const invalidUser = {
    message: 'Invalid user',
    code: 'invalid_user',
    statusCode: 403,
};

const unauthorizedUser = {
    message: 'Unauthorized user',
    code: 'unauth_user',
    statusCode: 403,
};

const jwtAuth = function (req, header, verifyUserFn, callback) {
    if (header) {
        const matches = header.match(/(\S+)\s+(\S+)/);

        // Here, we are simply going to trust the identity in the token. If it validates and is in date, it is good to go
        if (matches && matches[1] === 'Bearer') {
            const token = matches[2];
            console.log("verify token")
            return jwt.verify(token, process.env.JWT_SECRET, {}, (err, decodedToken) => {
                if (err) {
                    console.log(err)
                    return callback(invalidAuth);   
                }
                // IF the the token contains a timeout claim, check the expiration
                if(decodedToken.iat && decodedToken.iat < Date.now() - 1000 *60 * 60 * 24)
                {
                    console.log("bad iat!",decodedToken.iat)
                    return callback(invalidAuth);   
                }
                if (decodedToken.sub) {
                    const err2 = verifyUserFn(decodedToken.sub);
                    req.user = Object.assign({originalUsername:decodedToken.sub.username}, decodedToken.sub);
                    return callback(err2);
                }
                return callback(invalidUser);
            });
        }
        return callback(invalidAuth);
    }
    return callback(noAuth);
};

const roleCheck = function roleCheck(role) {
    return function roleCh(user) {
        if (user.role === role) {
            return null;
        }
        return unauthorizedUser;
    };
};

const rolesCheck = function rolesCheck(roles) {
    return function rolesChe(user) {
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
    clinician(req, def, header, callback) {
        jwtAuth(req, header, rolesCheck(['clinician', 'admin']), callback);
    },
    self(req, def, header, callback) {
        jwtAuth(req, header, _.constant(null), callback);
    },
    any(req, def, header, callback) {
        jwtAuth(req, header, _.constant(null), function nullFunction() {
            callback(null);
        });
    },
};
