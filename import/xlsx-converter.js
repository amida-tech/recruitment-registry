'use strict';

const xlsx = require('xlsx');
const moment = require('moment');

const SPromise = require('../lib/promise');

const origin = moment.utc('19000101 000000');
const milliSecondsInADay = 1000 * 60 * 60 * 24;

module.exports = class XLSXConverter {
    constructor(options = {}) {
        this.options = options;
    }

    static convertDateTime(rawValue) {
        const pieces = rawValue.toString().split('.');
        const rawDate = parseInt(pieces[0], 10);
        const rawTime = parseFloat(`0.${pieces[1]}`) * milliSecondsInADay;

        const m = moment(origin);
        m.add(rawDate - 2, 'days');
        m.add(rawTime, 'milliseconds');

        return m.format();
    }

    static convertDateTimes(content, properties) {
        content.forEach((r) => {
            properties.forEach((p) => {
                r[p] = XLSXConverter.convertDateTime(r[p]);
            });
        });
    }

    fileToRecords(filepath) {
        const px = new SPromise((resolve, reject) => {
            try {
                const workbook = xlsx.readFile(filepath);
                if (this.options.sheets) {
                    const result = this.options.sheets.reduce((r, { name }) => {
                        const worksheet = workbook.Sheets[name];
                        const rows = xlsx.utils.sheet_to_json(worksheet, { raw: true });
                        r[name] = rows;
                        return r;
                    }, {});
                    resolve(result);
                } else {
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = xlsx.utils.sheet_to_json(worksheet, { raw: true });
                    if (this.options.dateTimes) {
                        XLSXConverter.convertDateTimes(json, this.options.dateTimes);
                    }
                    resolve(json);
                }
            } catch (err) {
                reject(err);
            }
        });
        return px;
    }
};
