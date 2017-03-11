'use strict';

const _ = require('lodash');

const extractMeta = function (record, metaOptions) {
    return metaOptions.reduce((r, propertyInfo) => {
        const name = propertyInfo.name;
        const value = record[name];
        if (!_.isNil(value)) {
            r[name] = value;
        }
        return r;
    }, {});
};

const updateMeta = function (target, record, options) {
    if (options.meta) {
        const meta = extractMeta(record, options.meta);
        if (Object.keys(meta).length > 0) {
            target.meta = meta;
        }
    }
};

module.exports = {
    extractMeta,
    updateMeta,
};
