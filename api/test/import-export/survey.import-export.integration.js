/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');
const mkdirp = require('mkdirp');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/entity-generator');
const SurveyHistory = require('../util/survey-history');
const surveyCommon = require('../util/survey-common');
const intoStream = require('into-stream');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('survey import-export integration', function () {
    const rrSuperTest = new RRSuperTest();
    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    _.range(8).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    _.forEach([2, 6], index => {
        it(`delete survey ${index}`, tests.deleteSurveyFn(index));
    });

    it('list all surveys (export)', tests.listSurveysFn('export'));

    _.range(8, 14).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    _.forEach([3, 11], index => {
        it(`delete survey ${index}`, tests.deleteSurveyFn(index));
    });

    it('list all surveys (export)', tests.listSurveysFn('export'));

    const generatedDirectory = path.join(__dirname, '../generated');

    it('create output directory if necessary', function (done) {
        mkdirp(generatedDirectory, done);
    });

    it('export questions to csv', function (done) {
        rrSuperTest.get('/questions/csv', true, 200)
            .expect(function (res) {
                const filepath = path.join(generatedDirectory, 'question.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('export surveys to csv', function (done) {
        rrSuperTest.get('/surveys/csv', true, 200)
            .expect(function (res) {
                const filepath = path.join(generatedDirectory, 'survey.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('reset database', shared.setUpFn(rrSuperTest));

    let questionIdMap;

    it('import question csv into db', function (done) {
        const filepath = path.join(generatedDirectory, 'question.csv');
        rrSuperTest.postFile('/questions/csv', 'questioncsv', filepath, null, 201)
            .expect(function (res) {
                questionIdMap = res.body;
            })
            .end(done);
    });

    let idMap;

    it('import survey csv into db', function (done) {
        const filepath = path.join(generatedDirectory, 'survey.csv');
        const questionidmap = JSON.stringify(questionIdMap);
        rrSuperTest.postFile('/surveys/csv', 'surveycsv', filepath, { questionidmap }, 201)
            .expect(function (res) {
                idMap = res.body;
            })
            .end(done);
    });

    it('list imported surveys and verify', function () {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            const query = { scope: 'export' };
            rrSuperTest.get('/surveys', true, 200, query)
                .expect(function (res) {
                    const expected = hxSurvey.listServersByScope('export');
                    surveyCommon.updateIds(expected, idMap, questionIdMap);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    });
});
