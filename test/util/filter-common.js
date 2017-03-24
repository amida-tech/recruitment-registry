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

const IntegrationTests = class FilterIntegrationTests {
    constructor(rrSuperTest, hxQuestion) {
        this.rrSuperTest = rrSuperTest;
        this.hxQuestion = hxQuestion;
        this.hxFilter = new History();
        this.filterGenerator = new FilterGenerator();
    }

    createFilterFn() {
        const rrSuperTest = this.rrSuperTest;
        const filterGenerator = this.filterGenerator;
        const hxFilter = this.hxFilter;
        const hxQuestion = this.hxQuestion;
        return function createFilter() {
            const filter = filterGenerator.newFilter(hxQuestion);
            return rrSuperTest.post('/filters', filter, 201)
                .then(res => hxFilter.push(filter, res.body));
        };
    }

    getFilterFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxFilter = this.hxFilter;
        return function getFilter() {
            const id = hxFilter.id(index);
            return rrSuperTest.get(`/filters/${id}`, true, 200)
                .then((res) => {
                    hxFilter.updateServer(index, res.body);
                    comparator.filter(hxFilter.client(index), res.body);
                });
        };
    }

    listFiltersFn(count) {
        const rrSuperTest = this.rrSuperTest;
        const hxFilter = this.hxFilter;
        return function listFilter() {
            return rrSuperTest.get('/filters', true, 200)
                .then((res) => {
                    const filters = res.body;
                    expect(filters.length).to.equal(count);
                    const fields = ['id', 'name', 'maxCount', 'createdAt'];
                    const expected = hxFilter.listServers(fields);
                    expect(filters).to.deep.equal(expected);
                });
        };
    }

    deleteFilterFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxFilter = this.hxFilter;
        return function deleteFilter() {
            const id = hxFilter.id(index);
            return rrSuperTest.delete(`/filters/${id}`, 204)
                .then(() => hxFilter.remove(index));
        };
    }

    patchFilterFn(index, fields) {
        const rrSuperTest = this.rrSuperTest;
        const filterGenerator = this.filterGenerator;
        const hxFilter = this.hxFilter;
        const hxQuestion = this.hxQuestion;
        return function patchFilter() {
            const filter = filterGenerator.newFilter(hxQuestion);
            const filterPatch = _.pick(filter, fields);
            const server = hxFilter.server(index);
            return rrSuperTest.patch(`/filters/${server.id}`, filterPatch, 204)
                .then(() => Object.assign(server, filterPatch));
        };
    }

    verifyFilterFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxFilter = this.hxFilter;
        return function verifyFilter() {
            const id = hxFilter.id(index);
            return rrSuperTest.get(`/filters/${id}`, true, 200)
                .then((res) => {
                    const expected = hxFilter.server(index);
                    expect(res.body).to.deep.equal(expected);
                });
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
