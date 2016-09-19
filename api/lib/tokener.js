'use strict';

const jwt = require('jsonwebtoken');

const config = require('../config');

exports.createJWT = function ({ id, username, role }) {
    const secret = config.jwt.secret;
    return jwt.sign({ id, username, role }, secret, { expiresIn: '30d' });
};
