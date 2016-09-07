'use strict';

const models = require('../../models');

const User = models.User;

exports.getGenders = function (req, res) {
    const result = User.genders();
    res.status(200).json(result);
};
