'use strict';

const _ = require('lodash');

exports.errToJSON = function (err) {
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

exports.findStanding = function (selections) {
    const result = [];
    selections.forEach(selection => {
        const newResultElement = selection.slice();
        const removed = _.remove(newResultElement, r => r < 0).map(r => -r);
        result.forEach(r => _.pullAll(r, removed));
        result.forEach(r => _.pullAll(r, newResultElement));
        result.push(_.sortBy(newResultElement));
    });
    return result;
};
