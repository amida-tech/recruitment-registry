/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const path = require('path');
const _ = require('lodash');
const chai = require('chai');

const ccfImport = require('../../import/ccf');
const ccfExport = require('../../export/ccf');

const fileCompare = require('../util/file-compare');

const expect = chai.expect;

describe('ccf import-export ccf', function () {
    const fixtureDir = path.join(__dirname, '../fixtures/import-export/ccf');

    let jsonDB = null;

    const filenames = {
        pillars: 'ccf-pillars.csv',
        questions: 'ccf-questions.csv',
        answers: 'ccf-answers.xlsx',
        assessments: 'ccf-assessments.xlsx'
    };

    const filepaths = {};
    _.forOwn(filenames, (name, key) => {
        if (name.charAt(0) === '/') {
            filepaths[key] = name;
        } else {
            filepaths[key] = path.join(fixtureDir, name);
        }
    });

    it('import ccf files to json db', function () {
        return ccfImport.importFiles(filepaths)
            .then(result => jsonDB = result);
    });

    let exportedJsonDB = null;

    it('export json db', function () {
        exportedJsonDB = ccfExport.convertJsonDB(jsonDB);
    });

    it('compare pillars', function () {
        fileCompare.contentToFile(exportedJsonDB.pillars, filepaths.pillars);
    });

    it('compare questions', function () {
        fileCompare.contentToFile(exportedJsonDB.questions, filepaths.questions);
    });

    it('compare assessments', function () {
        return ccfImport.converters.assessments().fileToRecords(filepaths.assessments)
            .then(rawJson => {
                expect(jsonDB.assessments).to.deep.equal(rawJson);
            });
    });

    it('compare answers', function () {
        return ccfImport.converters.assessments().fileToRecords(filepaths.answers)
            .then(rawJson => {
                rawJson.forEach(r => delete r.id);
                expect(exportedJsonDB.answers).to.deep.equal(rawJson);
            });
    });
});
