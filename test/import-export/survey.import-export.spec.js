/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/generator');
const SurveyHistory = require('../util/survey-history');
const surveyCommon = require('../util/survey-common');
const intoStream = require('into-stream');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('survey import-export unit', function surveyImportExportUnit() {
    before(shared.setUpFn());

    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.SpecTests(generator, hxSurvey);

    _.range(8).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    [2, 6].forEach((index) => {
        it(`delete survey ${index}`, tests.deleteSurveyFn(index));
    });

    it('list all surveys (export)', tests.listSurveysFn({ scope: 'export' }));

    _.range(8, 14).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    [3, 11].forEach((index) => {
        it(`delete survey ${index}`, tests.deleteSurveyFn(index));
    });

    it('list all surveys (export)', tests.listSurveysFn({ scope: 'export' }));

    let questionCsvContent;
    let sectionCsvContent;
    let surveyCsvContent;

    it('export questions to csv', function exportQuestionsToCSV() {
        return models.question.exportQuestions()
            .then((result) => { questionCsvContent = result; });
    });

    it('export sections to csv', function exportSectionsToCSV() {
        return models.section.exportSections()
            .then((result) => { sectionCsvContent = result; });
    });

    it('export surveys to csv', function exportSurveysToCSV() {
        return models.survey.exportSurveys()
            .then((result) => { surveyCsvContent = result; });
    });

    it('reset database', shared.setUpFn());

    let questionIdMap;

    it('import question csv into db', function importQuestionsFromCSV() {
        const stream = intoStream(questionCsvContent);
        return models.question.importQuestions(stream)
            .then((result) => { questionIdMap = result; });
    });

    let sectionIdMap;

    it('import section csv into db', function importSectionsFromCSV() {
        const stream = intoStream(sectionCsvContent);
        return models.section.importSections(stream)
            .then((result) => { sectionIdMap = result; });
    });

    let idMap;

    it('import survey csv into db', function importSurveysFromCSV() {
        const stream = intoStream(surveyCsvContent);
        return models.survey.importSurveys(stream, { questionIdMap, sectionIdMap })
            .then((result) => { idMap = result; });
    });

    it('list imported surveys and verify', function listImportedAndVerify() {
        return models.survey.listSurveys({ scope: 'export' })
            .then((list) => {
                let expected = hxSurvey.listServersByScope({ scope: 'export' });
                expected = _.cloneDeep(expected);
                surveyCommon.updateIds(expected, idMap, questionIdMap, sectionIdMap);
                expect(list.length).to.equal(expected.length);
                list.forEach((actual, index) => {
                    expect(actual).to.deep.equal(expected[index]);
                });
            });
    });

    // const verifySurveyFn = function (index) {
    //   return function verifySurvey() {
    //       const survey = hxSurvey.server(index);
    //       const id = parseInt(idMap[survey.id], 10);
    //       return models.survey.getSurvey(id)
    //           .then((actual) => {
    //               expect(actual).to.deep.equal(survey);
    //           });
    //   };
    // };


    // const allIndices = _.range(14);
    // [11, 6, 3, 2].forEach(index => allIndices.splice(index, 1));
    // allIndices.forEach((index) => {
    //   it(`verify survey ${index}`, verifySurveyFn(index));
    // });
});
