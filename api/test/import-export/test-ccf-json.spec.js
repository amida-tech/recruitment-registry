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

    let dbExport;

    it('export assessments from database', function () {
        const idMap = { 1: 10, 2: 36, 3: 62 };
        return ccfExport.exportAssessments()
            .then(result => {
                dbExport = result;
                dbExport.assessments.forEach(record => record.id = idMap[record.id]);
            });
    });

    it('compare db assessments', function () {
        return ccfImport.converters.assessments().fileToRecords(filepaths.assessments)
            .then(rawJson => {
                expect(dbExport.assessments).to.deep.equal(rawJson);
            });
    });

    it('compare db answers', function () {
        return ccfImport.converters.answers().fileToRecords(filepaths.answers)
            .then(rawJson => {
                const expected = _.sortBy(rawJson, ['hb_assessment_id', 'pillar_hash', 'answer_hash']);
                const actual = _.sortBy(dbExport.answers, ['hb_assessment_id', 'pillar_hash', 'answer_hash']);
                const assessmentMap = new Map([
                    [1, 10],
                    [2, 36],
                    [3, 62]
                ]);
                actual.forEach(answer => {
                    answer.hb_user_id = 1;
                    answer.hb_assessment_id = assessmentMap.get(answer.hb_assessment_id);
                    delete answer.id;
                });
                expected.forEach(answer => {
                    delete answer.id;
                    answer.string_value = answer.string_value.toString();
                    if (answer.answer_hash === 'answer_profile_birthday_month') {
                        if (answer.string_value.length === 1) {
                            answer.string_value = '0' + answer.string_value;
                        }
                    }
                });
                expect(actual).to.deep.equal(expected);
            });
    });
});
