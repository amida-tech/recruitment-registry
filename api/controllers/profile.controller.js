'use strict';

const models = require('../models');
const shared = require('./shared.js');

const profile = models.profile;

exports.createProfile = function (req, res) {
    const { user, answers, signatures, language } = req.body;
    profile.createProfile({ user, answers, signatures }, language)
        .then(tokenObj => res.status(201).json(tokenObj))
        .catch(shared.handleError(res));
};

exports.updateProfile = function (req, res) {
    const { user, answers, language } = req.body;
    profile.updateProfile(req.user.id, { user, answers }, language)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.getProfile = function (req, res) {
    profile.getProfile({ userId: req.user.id })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
