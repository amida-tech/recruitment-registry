'use strict';

const jsutil = require('../lib/jsutil');
const RRError = require('../lib/rr-error');

exports.handleError = function (res) {
    return function (err) {
        let statusCode = 500;
        if (err instanceof RRError) {
            statusCode = 400;
        } else if (err.name && (typeof err.name === 'string')) {
            if ((err.name.toLowerCase().slice(0, 9) === 'sequelize')) {
                statusCode = 400;
            }
        }
        const json = jsutil.errToJSON(err);
        res.status(statusCode).json(json);
    };
};
