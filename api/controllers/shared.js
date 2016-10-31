'use strict';

const Sequelize = require('sequelize');

const jsutil = require('../lib/jsutil');
const RRError = require('../lib/rr-error');

exports.handleError = function (res) {
    return function (err) {
        const json = jsutil.errToJSON(err);
        if (err instanceof RRError) {
            return res.status(400).json(json);
        }
        if (err instanceof Sequelize.Error) {
            return res.status(400).json(json);
        }
        res.status(500).json(json);
    };
};
