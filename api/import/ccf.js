'use strict';

const SPromise = require('../lib/promise');

const CSVConverter = require('./csv-converter');

const importFile = function (filepaths, result, key) {
    const filepath = filepaths[key];
    const converter = new CSVConverter();
    return converter.fileToRecords(filepath)
        .then(json => result[key] = json);
};

const importFiles = function (filepaths) {
    const result = {};
    return SPromise.all([
            importFile(filepaths, result, 'answer')
        ])
        .then(() => result);
};

module.exports = {
    importFiles
};
