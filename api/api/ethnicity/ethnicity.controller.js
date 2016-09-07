'use strict';

const models = require('../../models');

const Ethnicity = models.Ethnicity;

exports.getEthnicities = function (req, res) {
    const result = Ethnicity.ethnicities();
    res.status(200).json(result);
};
