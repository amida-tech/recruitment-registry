'use strict';

const Sequelize = require('sequelize');

const jsutil = require('../lib/jsutil');
const RRError = require('../lib/rr-error');

const sequelizeErrorMap = {
    SequelizeUniqueConstraintError: {
        'lower(email)': 'uniqueEmail'
    }
};

const transformSequelizeError = function (err) {
    const topSpecification = sequelizeErrorMap[err.name];
    if (topSpecification) {
        const fields = err.fields;
        if (fields && (typeof fields === 'object')) {
            const key = Object.keys(fields)[0];
            const code = topSpecification[key];
            if (code) {
                return new RRError(code);
            }
        }
    }
    return err;
};

exports.handleError = function (res) {
    return function (err) {
        if (err instanceof Sequelize.Error) {
            err = transformSequelizeError(err);
        }
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
