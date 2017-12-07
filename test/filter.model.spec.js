/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');
const filterCommon = require('./util/filter-common');

describe('filter unit', function filterUnit() {
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxQuestion = new History();
    const qxTests = new questionCommon.SpecTests({ generator, hxQuestion });
    const tests = new filterCommon.SpecTests(hxQuestion);
    let count = 0;

    before(shared.setUpFn());

    ['choice', 'choices', 'integer'].forEach((type) => {
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
        return models.filter.createFilter(filter)
            .then(shared.throwingHandler, shared.expectedErrorHandler('filterMalformedNoAnswers'));
    });

    it('error: create filter without answers (empty array)', function errorCreateEmptyAnswers() {
        const id = hxQuestion.id(0);
        const filter = {
            name: 'name',
            questions: [{ id, answers: [] }],
        };
        return models.filter.createFilter(filter)
            .then(shared.throwingHandler, shared.expectedErrorHandler('filterMalformedNoAnswers'));
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

    it('list filters', tests.listFiltersFn(28));

    _.range(30, 40).forEach((index) => {
        it(`create filter ${index}`, tests.createFilterFn());
        it(`get filter ${index}`, tests.getFilterFn(index));
    });

    it('list filters', tests.listFiltersFn(38));
});
