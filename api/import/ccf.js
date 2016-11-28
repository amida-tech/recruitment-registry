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
    const pxs = Object.keys(filepaths).map(key => importFile(filepaths, result, key));
    return SPromise.all(pxs).then(() => result);
};

module.exports = {
    importFiles
};
