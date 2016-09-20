'use strict';

const jsutil = require('../lib/jsutil');

exports.handleError = function (res) {
    return function (err) {
        const json = jsutil.errToJSON(err);
        res.status(500).json(json);
    };
};
