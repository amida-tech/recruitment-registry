'use strict';

const fs = require('fs');
const csvToJson = require('csvtojson');

const SPromise = require('../lib/promise');

module.exports = class CSVConverter {
    constructor(options, jsonHandler) {
        this.options = options || {};
        this.jsonHandler = jsonHandler;
    }

    streamToRecords(stream) {
        const converter = new csvToJson.Converter(this.options);
        const px = new SPromise((resolve, reject) => {
            converter.on('end_parsed', resolve);
            converter.on('error', reject);
            if (this.jsonHandler) {
                converter.on('json', this.jsonHandler);
            }
        });
        stream.pipe(converter);
        return px;
    }

    fileToRecords(filepath) {
        const stream = fs.createReadStream(filepath);
        return this.streamToRecords(stream);
    }
};
