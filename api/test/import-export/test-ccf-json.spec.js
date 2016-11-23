/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const path = require('path');
const _ = require('lodash');

const ccfImport = require('../../import/ccf');
const ccfExport = require('../../export/ccf');

const fileCompare = require('../util/file-compare');

describe('ccf import-export ccf', function () {
    const fixtureDir = path.join(__dirname, '../fixtures/import-export/ccf');

    let jsonDB = null;

    const filenames = {
        pillars: 'ccf-pillars.csv',
        questions: 'ccf-questions.csv'
    };

    const filepaths = {};
    _.forOwn(filenames, (name, key) => filepaths[key] = path.join(fixtureDir, name));

    it('import ccf files to json db', function () {
        return ccfImport.importFiles(filepaths)
            .then(result => jsonDB = result);
    });

    it('export json db', function () {
        const files = ccfExport.convertJsonDB(jsonDB);
        fileCompare.contentToFile(files.pillars, filepaths.pillars);
    });
});
