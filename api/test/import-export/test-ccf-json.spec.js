/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');

const ccfImport = require('../../import/ccf');
const ccfExport = require('../../export/ccf');

const expect = chai.expect;

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
        const expectedPillars = fs.readFileSync(filepaths.pillars).toString();
        const expectedLines = expectedPillars.split('\n');
        const actualLines = files.pillars.split('\n');
        expect(actualLines).to.have.length.above(0, 'no lines generated');
        expect(expectedLines).to.have.length.above(0, 'no lines in source file');
        const numLines = Math.min(expectedLines.length, actualLines.length);
        _.range(numLines).forEach(index => {
            expect(actualLines[index]).to.equal(expectedLines[index]);
        });
    });
});
