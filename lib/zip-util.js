'use strict';

const SPromise = require('./promise');

exports.findVicinity = function (zip) {
    return SPromise.resolve([zip]);
};
