'use strict';

const Sequelize = require('sequelize');

const jsutil = require('../lib/jsutil');
const RRError = require('../lib/rr-error');

const sequelizeErrorMap = {
    SequelizeUniqueConstraintError: {
        'lower(email)': 'uniqueEmail',
        generic: 'genericUnique',
    },
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
            const genericCode = topSpecification.generic;
            if (genericCode) {
                const value = fields[key];
                return new RRError(genericCode, key, value);
            }
        }
    }
    return err;
};

exports.errToJSON = function errToJSON(err) {
    let localErr = err;
    if (localErr instanceof Sequelize.Error) {
        localErr = transformSequelizeError(err);
    }
    if (localErr instanceof RRError) {
        const message = localErr.getMessage();
        const json = jsutil.errToJSON(localErr);
        json.message = message;
        return json;
    }
    return jsutil.errToJSON(localErr);
};

exports.handleError = function (res) {
    return function (err) {
        const json = exports.errToJSON(err);
        if (err instanceof RRError) {
            const statusCode = err.statusCode || 400;
            return res.status(statusCode).json(json);
        }
        if (err instanceof Sequelize.Error) {
            return res.status(400).json(json);
        }
        return res.status(500).json(json);
    };
};
