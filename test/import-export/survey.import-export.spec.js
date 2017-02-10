/* global describe,before,it*/
'use strict';
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

describe('survey import-export unit', function () {
    before(shared.setUpFn());

    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.SpecTests(generator, hxSurvey);

    _.range(8).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    _.forEach([2, 6], index => {
        it(`delete survey ${index}`, tests.deleteSurveyFn(index));
    });

    it('list all surveys (export)', tests.listSurveysFn({ scope: 'export' }));

    _.range(8, 14).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    _.forEach([3, 11], index => {
        it(`delete survey ${index}`, tests.deleteSurveyFn(index));
    });

    it('list all surveys (export)', tests.listSurveysFn({ scope: 'export' }));

    let questionCsvContent;
    let surveyCsvContent;

    it('export questions to csv', function () {
        return models.question.export()
            .then(result => questionCsvContent = result);
    });

    it('export surveys to csv', function () {
        return models.survey.export()
            .then(result => surveyCsvContent = result);
    });

    it('reset database', shared.setUpFn());

    let questionIdMap;

    it('import question csv into db', function () {
        const stream = intoStream(questionCsvContent);
        return models.question.import(stream)
            .then(result => questionIdMap = result);
    });

    let idMap;

    it('import survey csv into db', function () {
        const stream = intoStream(surveyCsvContent);
        return models.survey.import(stream, questionIdMap)
            .then(result => idMap = result);
    });

    it('list imported surveys and verify', function () {
        return models.survey.listSurveys({ scope: 'export' })
            .then(list => {
                const expected = hxSurvey.listServersByScope({ scope: 'export' });
                surveyCommon.updateIds(expected, idMap, questionIdMap);
                expect(list).to.deep.equal(expected);
            });
    });
});
