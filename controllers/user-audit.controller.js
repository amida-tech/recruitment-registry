'use strict';

const shared = require('./shared.js');

exports.listUserAudits = function listUserAudits(req, res) {
    return req.models.userAudit.listUserAudits()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
