'use strict';

const toJSON = function (err) {
    if (typeof err === 'object') {
        return Object.getOwnPropertyNames(err).reduce((r, key) => {
            r[key] = err[key];
            return r;
        }, {});
    }
    return {
        message: 'Unknown internal error.',
        original: err
    };
};

exports.handleError = function (res) {
    return function (err) {
        const json = toJSON(err);
        res.status(500).json(json);
    };
};
