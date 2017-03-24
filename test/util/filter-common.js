'use strict';

const _ = require('lodash');
const chai = require('chai');

const models = require('../../models');
const FilterGenerator = require('./generator/filter-generator');
const comparator = require('./comparator');
const History = require('./history');

const expect = chai.expect;

const SpecTests = class FilterSpecTests {
    constructor(hxQuestion) {
        this.hxQuestion = hxQuestion;
        this.hxFilter = new History();
        this.filterGenerator = new FilterGenerator();
    }

    createFilterFn() {
        const filterGenerator = this.filterGenerator;
        const hxFilter = this.hxFilter;
        const hxQuestion = this.hxQuestion;
        return function createFilter() {
            const filter = filterGenerator.newFilter(hxQuestion);
            return models.filter.createFilter(filter)
                .then(({ id }) => hxFilter.push(filter, { id }));
        };
    }

    getFilterFn(index) {
        const hxFilter = this.hxFilter;
        return function getFilter() {
            const id = hxFilter.id(index);
            return models.filter.getFilter(id)
                .then((filter) => {
                    hxFilter.updateServer(index, filter);
                    comparator.filter(hxFilter.client(index), filter);
                });
        };
    }

    listFiltersFn(count) {
        const hxFilter = this.hxFilter;
        return function listFilter() {
            return models.filter.listFilters()
                .then((filters) => {
                    expect(filters.length).to.equal(count);
                    const fields = ['id', 'name', 'maxCount', 'createdAt'];
                    const expected = hxFilter.listServers(fields);
                    expect(filters).to.deep.equal(expected);
                });
        };
    }

    deleteFilterFn(index) {
        const hxFilter = this.hxFilter;
        return function deleteFilter() {
            const id = hxFilter.id(index);
            return models.filter.deleteFilter(id)
                .then(() => hxFilter.remove(index));
        };
    }

    patchFilterFn(index, fields) {
        const filterGenerator = this.filterGenerator;
        const hxFilter = this.hxFilter;
        const hxQuestion = this.hxQuestion;
        return function patchFilter() {
            const filter = filterGenerator.newFilter(hxQuestion);
            const filterPatch = _.pick(filter, fields);
            const server = hxFilter.server(index);
            return models.filter.patchFilter(server.id, filterPatch)
                .then(() => Object.assign(server, filterPatch));
        };
    }

    verifyFilterFn(index) {
        const hxFilter = this.hxFilter;
        return function verifyFilter() {
            const id = hxFilter.id(index);
            return models.filter.getFilter(id)
                .then((filter) => {
                    const expected = hxFilter.server(index);
                    expect(filter).to.deep.equal(expected);
                });
        };
    }
};

module.exports = {
    SpecTests,
};
