'use strict';

const _ = require('lodash');

const extractMeta = function (record, metaOptions) {
    return metaOptions.reduce((r, propertyInfo) => {
        const name = propertyInfo.name;
        const value = record[name];
        if (!_.isNil(value)) {
            const type = propertyInfo.type;
            if (type === 'boolean') {
                r[name] = value.toLowerCase() === 'true';
            } else if (type === 'integer') {
                r[name] = parseInt(value, 10);
            } else {
                r[name] = value;
            }
        }
        return r;
    }, {});
};

const updateMeta = function (target, record, options) {
    if (options.meta) {
        const meta = extractMeta(record, options.meta);
        if (Object.keys(meta).length > 0) {
            target.meta = meta; // eslint-disable-line no-param-reassign
        }
    }
};

module.exports = {
    extractMeta,
    updateMeta,
};
