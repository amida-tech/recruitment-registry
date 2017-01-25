/* global before,describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const path = require('path');
const _ = require('lodash');
const chai = require('chai');

const ccfImport = require('../../import/ccf');
const ccfExport = require('../../export/ccf');

const SharedSpec = require('../util/shared-spec.js');

const expect = chai.expect;
const shared = new SharedSpec();

describe('ccf import-export ccf', function () {
    const fixtureDir = path.join(__dirname, '../fixtures/import-export/ccf');

    const filenames = {
        users: 'ccf-user.xls',
        answers: 'ccf-answers.xlsx',
        assessments: 'ccf-assessments.xlsx',
        surveys: 'ccf-questions.xlsx'
    };

    const filepaths = _.transform(filenames, (r, name, key) => {
        if (name.charAt(0) === '/') {
            r[key] = name;
        } else {
            r[key] = path.join(fixtureDir, name);
        }
        return r;
    }, {});

    before(shared.setUpFn());

    let userIdMap;
    it('import to database', function () {
        return ccfImport.importCCFFiles(filepaths)
            .then(result => userIdMap = result);
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
        const idMap = { 1: 10, 2: 36, 3: 62, 4: 87, 5: 113, 6: 139 };
        return ccfExport.exportAssessments()
            .then(result => {
                dbExport = result;
                dbExport.assessments.forEach(record => record.id = idMap[record.id]);
            });
    });

    it('compare db assessments', function () {
        return ccfImport.converters.assessments().fileToRecords(filepaths.assessments)
            .then(rawJson => {
                rawJson.forEach(assessment => assessment.hb_user_id = userIdMap.get(assessment.hb_user_id));
                const expected = _.sortBy(rawJson, ['hb_user_id', 'assessment_id']);
                const actual = _.sortBy(dbExport.assessments, ['hb_user_id', 'assessment_id']);
                expect(actual).to.deep.equal(expected);
            });
    });

    it('compare db answers', function () {
        return ccfImport.converters.answers().fileToRecords(filepaths.answers)
            .then(rawJson => {
                rawJson.forEach(answer => answer.hb_user_id = userIdMap.get(answer.hb_user_id));
                const expected = _.sortBy(rawJson, ['hb_user_id', 'hb_assessment_id', 'pillar_hash', 'answer_hash']);
                const actual = _.sortBy(dbExport.answers, ['hb_user_id', 'hb_assessment_id', 'pillar_hash', 'answer_hash']);
                const assessmentMap = new Map([
                    [1, 10],
                    [2, 36],
                    [3, 62],
                    [4, 87],
                    [5, 113],
                    [6, 139]
                ]);
                actual.forEach(answer => {
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
