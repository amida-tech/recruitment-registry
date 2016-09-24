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
        const toBeRemoved = selection.map(r => r < 0 ? -r : r);
        const toBeInserted = selection.filter(r => r >= 0);
        result.forEach(r => _.pullAll(r, toBeRemoved));
        result.push(_.sortBy(toBeInserted));
    });
    return result;
};

exports.findRemoved = function (selections) {
    const result = [];
    const actualResult = [];
    selections.forEach((selection, timeIndex) => {
        const toBeRemoved = selection.map(r => r < 0 ? -r : r);
        const toBeInserted = selection.filter(r => r >= 0);
        result.forEach((r, index) => {
            const levelRemoved = _.intersection(r, toBeRemoved);
            _.pullAll(r, toBeRemoved);
            actualResult[index].push({ timeIndex, removed: levelRemoved });
        });
        result.push(_.sortBy(toBeInserted));
        actualResult.push([]);
    });
    return actualResult;
};
