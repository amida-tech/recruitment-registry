'use strict';

const xlsx = require('xlsx');

const SPromise = require('../lib/promise');

module.exports = class XLSXConverter {
    fileToRecords(filepath) {
        const px = new SPromise((resolve, reject) => {
            try {
                const workbook = xlsx.readFile(filepath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = xlsx.utils.sheet_to_json(worksheet, { raw: true });
                resolve(json);
            } catch (err) {
                reject(err);
            }
        });
        return px;
    }
};
