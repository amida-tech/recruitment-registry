'use strict';

const shared = require('./shared.js');
const tokener = require('../lib/tokener');

const sendMail = require('../lib/email');

exports.createProfile = function createProfile(req, res) {
    const { user, answers, signatures, language } = req.body;
    req.models.profile.createProfile({ user, answers, signatures }, language)
        .then((record) => {
            sendMail(user, 'new_contact', {});

            const token = tokener.createJWT(record);
            res.cookie('rr-jwt-token', token);
            res.status(201).json({ id: user.id });
        })
        .catch(shared.handleError(res));
};

exports.updateProfile = function updateProfile(req, res) {
    const { user, answers, language } = req.body;
    req.models.profile.updateProfile(req.user.id, { user, answers }, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getProfile = function getProfile(req, res) {
    req.models.profile.getProfile({ userId: req.user.id })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
