'use strict';

exports.errToJSON = function errToJSON(err) {
    if (typeof err === 'object') {
        return Object.getOwnPropertyNames(err).reduce((r, key) => {
            r[key] = err[key];
            return r;
        }, {});
    }
    return {
        message: 'Unknown internal error.',
        original: err,
    };
};
