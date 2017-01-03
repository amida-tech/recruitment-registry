/* global before,describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const path = require('path');
const _ = require('lodash');
const chai = require('chai');

const ccfImport = require('../../import/ccf');
const ccfExport = require('../../export/ccf');

const SharedSpec = require('../util/shared-spec.js');
const History = require('../util/history');

const expect = chai.expect;
const shared = new SharedSpec();

describe('ccf import-export ccf', function () {
    const fixtureDir = path.join(__dirname, '../fixtures/import-export/ccf');

    let jsonDB = null;

    const filenames = {
        answers: 'ccf-answers.xlsx',
        assessments: 'ccf-assessments.xlsx',
        surveys: 'ccf-questions.xlsx'
    };

    const filepaths = {};
    _.forOwn(filenames, (name, key) => {
        if (name.charAt(0) === '/') {
            filepaths[key] = name;
        } else {
            filepaths[key] = path.join(fixtureDir, name);
        }
    });

    const hxUser = new History();

    for (let i = 0; i < 1; ++i) {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    }

    before(shared.setUpFn());

    it('import ccf files to json db', function () {
        return ccfImport.importFiles(filepaths)
            .then(result => jsonDB = result);
    });

    let exportedJsonDB = null;

    it('import to database', function () {
        return ccfImport.importToDb(jsonDB);
    });

    it('import to database', function () {
        const userId = hxUser.id(0);
        return ccfImport.importAnswersToDb(jsonDB, userId);
    });

    it('export from database', function () {
        return ccfExport.exportSurveys()
            .then(result => {
                return ccfImport.converters.surveys().fileToRecords(filepaths.surveys)
                    .then(rawJson => {
                        expect(result.questions).to.deep.equal(rawJson.Questions);
                        expect(result.pillars).to.deep.equal(rawJson.Pillars);
                    });
            });
    });

    it('export json db', function () {
        exportedJsonDB = ccfExport.convertJsonDB(jsonDB);
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
