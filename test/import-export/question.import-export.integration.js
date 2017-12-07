/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');
const mkdirp = require('mkdirp');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/generator');
const History = require('../util/history');
const questionCommon = require('../util/question-common');

const expect = chai.expect;

describe('question integration unit', () => {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxQuestion = new History();
    const tests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(12).forEach((i) => {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
    });

    it('list all questions', tests.listQuestionsFn('export'));

    _.forEach([1, 6, 10], (index) => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('list all questions (export)', tests.listQuestionsFn('export'));

    _.range(12, 24).forEach((i) => {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
    });

    _.forEach([4, 17], (index) => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('list all questions (export)', tests.listQuestionsFn('export'));

    const generatedDirectory = path.join(__dirname, '../generated');

    it('create output directory if necessary', (done) => {
        mkdirp(generatedDirectory, done);
    });

    it('export questions to csv', (done) => {
        rrSuperTest.get('/questions/csv', true, 200)
            .expect((res) => {
                const filepath = path.join(generatedDirectory, 'question.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('reset database', shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    let idMap;

    it('import csv into db', (done) => {
        const filepath = path.join(generatedDirectory, 'question.csv');
        rrSuperTest.postFile('/questions/csv', 'questioncsv', filepath, null, 201)
            .expect((res) => {
                idMap = res.body;
            })
            .end(done);
    });

    it('list imported questions and verify', () => {
        const query = { scope: 'export' };
        return function listImported(done) {
            rrSuperTest.get('/questions', true, 200, query)
                .expect((res) => {
                    const fields = questionCommon.getFieldsForList('export');
                    const expected = hxQuestion.listServers(fields);
                    questionCommon.updateIds(expected, idMap);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    });
});
