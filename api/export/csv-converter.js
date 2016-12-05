'use strict';

const json2csv = require('json2csv');

module.exports = class CSVConverter {
    constructor(options = {}) {
        this.options = options;
    }

    dataToCSV(data) {
        const result = json2csv({ data });
        return result;
    }
};
