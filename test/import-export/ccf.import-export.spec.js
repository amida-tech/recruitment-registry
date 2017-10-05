/* global before,describe,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const path = require('path');
const _ = require('lodash');
const chai = require('chai');

const ccfImport = require('../../import/ccf');
const ccfExport = require('../../export/ccf');

const SharedSpec = require('../util/shared-spec.js');

const expect = chai.expect;
const shared = new SharedSpec();

describe('ccf import-export ccf', function ccfImportExportUnit() {
    const fixtureDir = path.join(__dirname, '../fixtures/import-export/ccf');

    const filenames = {
        users: 'ccf-user.xls',
        answers: 'ccf-answers.xlsx',
        assessments: 'ccf-assessments.xlsx',
        surveys: 'ccf-questions.xlsx',
    };

    const filepaths = _.mapValues(filenames, (name) => {
        if (name.charAt(0) === '/') {
            return name;
        }
        return path.join(fixtureDir, name);
    });

    before(shared.setUpFn());

    let userIdMap;
    it('import to database', function importToDb() {
        return ccfImport.ImportFiles(filepaths)
            .then((result) => { userIdMap = result; });
    });

    it('export from database', function exportFromDb() {
        return ccfExport.exportSurveys()
            .then(result => ccfImport.converters.surveys().fileToRecords(filepaths.surveys)
                .then((rawJson) => {
                    const expected = rawJson.Questions;
                    expect(result.questions).to.deep.equal(expected);
                    expect(result.pillars).to.deep.equal(rawJson.Pillars);
                }));
    });

    let dbExport;

    it('export assessments from database', function exportAssessmentsFromDb() {
        const idMap = { 1: 10, 2: 36, 3: 62, 4: 87, 5: 113, 6: 139 };
        return ccfExport.exportAssessments()
            .then((result) => {
                dbExport = result;
                dbExport.assessments.forEach(r => Object.assign(r, { id: idMap[r.id] }));
            });
    });

    it('compare db assessments', function compareDbAssessments() {
        return ccfImport.converters.assessments().fileToRecords(filepaths.assessments)
            .then((rawJson) => {
                rawJson.forEach((assessment) => {
                    const userId = userIdMap.get(assessment.hb_user_id);
                    Object.assign(assessment, { hb_user_id: userId });
                });
                const expected = _.sortBy(rawJson, ['hb_user_id', 'assessment_id']);
                const actual = _.sortBy(dbExport.assessments, ['hb_user_id', 'assessment_id']);
                expect(actual).to.deep.equal(expected);
            });
    });

    it('compare db answers', function compareDbAnswers() {
        const fields = ['hb_user_id', 'hb_assessment_id', 'pillar_hash', 'answer_hash'];
        return ccfImport.converters.answers().fileToRecords(filepaths.answers)
            .then((rawJson) => {
                rawJson.forEach((answer) => {
                    const userId = userIdMap.get(answer.hb_user_id);
                    Object.assign(answer, { hb_user_id: userId });
                });
                const expected = _.sortBy(rawJson, fields);
                const actual = _.sortBy(dbExport.answers, fields);
                const assessmentMap = new Map([
                    [1, 10],
                    [2, 36],
                    [3, 62],
                    [4, 87],
                    [5, 113],
                    [6, 139],
                ]);
                /* eslint-disable no-param-reassign */
                actual.forEach((answer) => {
                    const assessmentId = assessmentMap.get(answer.hb_assessment_id);
                    Object.assign(answer, { hb_assessment_id: assessmentId });
                    delete answer.id;
                });
                expected.forEach((answer) => { // eslint-disable-line no-param-reassign: 0
                    delete answer.id;
                    answer.string_value = answer.string_value.toString();
                    if (answer.answer_hash === 'answer_profile_birthday_month') {
                        if (answer.string_value.length === 1) {
                            answer.string_value = `0${answer.string_value}`;
                        }
                    }
                });
                /* eslint-enable no-param-reassign */
                expect(actual).to.deep.equal(expected);
            });
    });
});
