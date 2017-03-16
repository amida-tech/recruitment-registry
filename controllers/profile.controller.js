'use strict';

const shared = require('./shared.js');
const tokener = require('../lib/tokener');

const sendMail = require('../lib/email');

exports.createProfile = function (req, res) {
    const { user, answers, signatures, language } = req.body;
    req.models.profile.createProfile({ user, answers, signatures }, language)
        .then((user) => {
            sendMail(user, 'new_contact', {});

            const token = tokener.createJWT(user);
            res.cookie('rr-jwt-token', token);
            res.status(201).json({ id: user.id });
        })
        .catch(shared.handleError(res));
};

exports.updateProfile = function (req, res) {
    const { user, answers, language } = req.body;
    req.models.profile.updateProfile(req.user.id, { user, answers }, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getProfile = function (req, res) {
    req.models.profile.getProfile({ userId: req.user.id })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
