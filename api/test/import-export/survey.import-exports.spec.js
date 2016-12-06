/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

//const chai = require('chai');
//const _ = require('lodash');

//const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/entity-generator');
const SurveyHistory = require('../util/survey-history');
const surveyCommon = require('../util/survey-common');
//const intoStream = require('into-stream');

//const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('survey import-export unit', function () {
    before(shared.setUpFn());

    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.SpecTests(generator, hxSurvey);

    for (let i = 0; i < 8; ++i) {
        it(`create survey ${i}`, tests.createSurveyFn());
        it(`get survey ${i}`, tests.getSurveyFn(i));
    }

    it('list all surveys (export)', tests.listSurveysFn('export'));

    //_.forEach([1, 6, 10], index => {
    //    it(`delete question ${index}`, tests.deleteQuestionFn(index));
    //});

    //it('list all questions (export)', tests.listQuestionsFn('export'));

    //for (let i = 12; i < 24; ++i) {
    //    it(`create question ${i}`, tests.createQuestionFn());
    //    it(`get question ${i}`, tests.getQuestionFn(i));
    //}

    //_.forEach([4, 17], index => {
    //    it(`delete question ${index}`, tests.deleteQuestionFn(index));
    //});

    //it('list all questions (export)', tests.listQuestionsFn('export'));

    //let csvContent;

    //it('export questions to csv', function () {
    //    return models.question.export()
    //        .then(result => csvContent = result);
    //});

    //it('reset database', shared.setUpFn());

    //let idMap;

    //it('import csv into db', function () {
    //    const stream = intoStream(csvContent);
    //    return models.question.import(stream)
    //        .then(result => idMap = result);
    //});

    //it('list imported questions and verify', function () {
    //    return models.question.listQuestions({ scope: 'export' })
    //        .then(list => {
    //            const fields = questionCommon.getFieldsForList('export');
    //            const expected = hxQuestion.listServers(fields);
    //            questionCommon.updateIds(expected, idMap);
    //            expect(list).to.deep.equal(expected);
    //        });
    //});
});
