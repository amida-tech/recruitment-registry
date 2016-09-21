'use strict';

const jwt = require('jsonwebtoken');

const config = require('../config');

exports.createJWT = function ({ id, username, role }) {
    const secret = config.jwt.secret;
    return jwt.sign({ id, username, role }, secret, { expiresIn: '30d' });
};

exports.verifyJWT = (function () {
    let jwtverify;

    const proxy = (token, callback) => {
        jwt.verify(token, config.jwt.secret, {}, callback);
    };

    return function (token) {
        if (!jwtverify) {
            const models = require('../models');
            jwtverify = models.sequelize.Promise.promisify(proxy, { context: jwt });
        }
        return jwtverify(token);
    };
})();
