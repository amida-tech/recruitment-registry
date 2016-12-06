'use strict';

const json2csv = require('json2csv');

module.exports = class CSVConverter {
    constructor(options = {}) {
        this.options = options;
    }

    dataToCSV(data) {
        const input = Object.assign({ data }, this.options);
        const result = json2csv(input);
        return result;
    }
};
