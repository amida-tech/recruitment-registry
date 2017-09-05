'use strict';

const jwt = require('jsonwebtoken');

const config = require('../config');
const SPromise = require('./promise');

const proxy = (token, callback) => {
    jwt.verify(token, config.jwt.secret, {}, callback);
};

exports.createJWT = function createJWT({ id, originalUsername }) {
    const secret = config.jwt.secret;
    return jwt.sign({ id, username: originalUsername }, secret, { expiresIn: '30d' });
};

exports.verifyJWT = SPromise.promisify(proxy, { context: jwt });
