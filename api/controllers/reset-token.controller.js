'use strict';

const resetToken = require('../lib/reset-token');

const shared = require('./shared.js');

exports.resetToken = function (req, res) {
    const email = req.body.email;
    const language = req.body.language;
    resetToken(email, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
