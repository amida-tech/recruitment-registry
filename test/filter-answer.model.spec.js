/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const FilterGenerator = require('./util/generator/filter-generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');

const expect = chai.expect;

describe('filter unit', () => {
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxQuestion = new History();
    const hxFilter = new History();
    const tests = new questionCommon.SpecTests(generator, hxQuestion);
    const questionGenerator = generator.questionGenerator;
    const filterGenerator = new FilterGenerator();
    let count = 0;

    before(shared.setUpFn());

    ['choice', 'choices'].forEach((type) => {
        _.range(count, count + 3).forEach((index) => {
            const question = questionGenerator.newQuestion(type);
            it(`create question ${index}`, tests.createQuestionFn(question));
            it(`get question ${index}`, tests.getQuestionFn(index));
        });
        count += 3;
        _.range(count, count + 3).forEach((index) => {
            const question = questionGenerator.newMultiQuestion(type);
            it(`create question ${index}`, tests.createQuestionFn(question));
            it(`get question ${index}`, tests.getQuestionFn(index));
        });
        count += 3;
    });

    _.range(count, count + 10).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });
    count += 10;

    _.range(count, count + 10).forEach((index) => {
        const question = questionGenerator.newMultiQuestion();
        it(`create question ${index}`, tests.createQuestionFn(question));
        it(`get question ${index}`, tests.getQuestionFn(index));
    });
    count += 10;

    const createFilterFn = function () {
        return function createFilter() {
            const filter = filterGenerator.newFilter(hxQuestion);
            return models.filter.createFilter(filter)
                .then(({ id }) => hxFilter.push(filter, { id }));
        };
    };

    const getFilterFn = function (index) {
        return function getFilter() {
            const id = hxFilter.id(index);
            return models.filter.getFilter(id)
                .then((filter) => {
                    hxFilter.updateServer(index, filter);
                    comparator.filter(hxFilter.client(index), filter);
                });
        };
    };

    const listFiltersFn = function () {
        return function listFilter() {
            return models.filter.listFilters()
                .then((filters) => {
                    const expected = hxFilter.listServers(['id', 'name', 'maxCount', 'createdAt']);
                    expect(filters).to.deep.equal(expected);
                });
        };
    };

    _.range(30).forEach((index) => {
        it(`create filter ${index}`, createFilterFn());
        it(`get filter ${index}`, getFilterFn(index));
    });

    it('list filters', listFiltersFn());
});
