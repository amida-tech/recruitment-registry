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

    it('write out answers', function () {
        console.log(JSON.stringify(jsonDB.assesmentAnswers, undefined, 4));
        //console.log(JSON.stringify(jsonDB.answers, undefined, 4));
        console.log(JSON.stringify(jsonDB.assessments, undefined, 4));
    });
});
