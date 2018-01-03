/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration.js');
const config = require('../config');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');
const filterCommon = require('./util/filter-common');

describe('filter integration', function filterIntegration() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxQuestion = new History();
    const qxTests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });
    const tests = new filterCommon.IntegrationTests(rrSuperTest, hxQuestion);
    let count = 0;

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    ['choice', 'choices', 'integer', 'date'].forEach((type) => {
        _.range(count, count + 8).forEach((index) => {
            it(`create question ${index}`, qxTests.createQuestionFn({ type }));
            it(`get question ${index}`, qxTests.getQuestionFn(index));
        });
        count += 8;
    });

    _.range(count, count + 10).forEach((index) => {
        it(`create question ${index}`, qxTests.createQuestionFn());
        it(`get question ${index}`, qxTests.getQuestionFn(index));
    });
    count += 10;

    _.range(count, count + 10).forEach((index) => {
        it(`create question ${index}`, qxTests.createQuestionFn({ multi: true }));
        it(`get question ${index}`, qxTests.getQuestionFn(index));
    });
    count += 10;

    it('error: create filter without answers (no property)', function errorCreateNoAnswers() {
        const id = hxQuestion.id(0);
        const filter = {
            name: 'name',
            questions: [{ id }],
        };
        return rrSuperTest.post('/filters', filter, 400);
    });

    it('error: create filter without answers (empty array)', function errorCreateEmptyAnswers() {
        const id = hxQuestion.id(0);
        const filter = {
            name: 'name',
            questions: [{ id, answers: [] }],
        };
        return rrSuperTest.post('/filters', filter, 400);
    });

    _.range(20).forEach((index) => {
        it(`create filter ${index}`, tests.createFilterFn());
        it(`get filter ${index}`, tests.getFilterFn(index));
    });

    it('list filters', tests.listFiltersFn(20));

    [5, 11].forEach((index) => {
        it(`delete filter ${index}`, tests.deleteFilterFn(index));
    });

    it('list filters', tests.listFiltersFn(18));

    _.range(20, 30).forEach((index) => {
        it(`create filter ${index}`, tests.createFilterFn());
        it(`get filter ${index}`, tests.getFilterFn(index));
    });

    it('list filters', tests.listFiltersFn(28));

    [20, 21].forEach((index) => {
        const fields = ['name'];
        it(`patch filter ${index} name`, tests.patchFilterFn(index, fields));
        it(`verify filter ${index}`, tests.verifyFilterFn(index));
    });

    [22, 23].forEach((index) => {
        const fields = ['name'];
        it(`patch filter ${index} name`, tests.patchFilterFn(index, fields));
        it(`verify filter ${index}`, tests.verifyFilterFn(index));
    });

    [24, 25].forEach((index) => {
        const fields = ['questions'];
        it(`patch filter ${index} name`, tests.patchFilterFn(index, fields));
        it(`verify filter ${index}`, tests.verifyFilterFn(index));
    });

    [26, 27].forEach((index) => {
        const fields = ['name', 'questions'];
        it(`patch filter ${index} name`, tests.patchFilterFn(index, fields));
        it(`verify filter ${index}`, tests.verifyFilterFn(index));
    });

    it('list filters', tests.listFiltersFn(28, true));

    it('list filters', tests.listFiltersFn(28));

    _.range(30, 40).forEach((index) => {
        it(`create filter ${index}`, tests.createFilterFn());
        it(`get filter ${index}`, tests.getFilterFn(index));
    });

    it('list filters', tests.listFiltersFn(38));

    it('logout as user', shared.logoutFn());
});
