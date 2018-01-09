'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');
const chai = require('chai');

const models = require('../../models');
const FilterGenerator = require('./generator/filter-generator');
const comparator = require('./comparator');
const History = require('./history');

const expect = chai.expect;

const FilterTests = class FilterTests {
    constructor(hxQuestion) {
        this.hxQuestion = hxQuestion;
        this.hxFilter = new History();
        this.filterGenerator = new FilterGenerator();
    }

    patchFilterFn(index, fields) {
        const self = this;
        return function patchFilter() {
            const hxQuestion = self.hxQuestion;
            const filter = self.filterGenerator.newFilter(hxQuestion);
            const filterPatch = _.pick(filter, fields);
            const server = self.hxFilter.server(index);
            return self.patchFilterPx(server.id, filterPatch)
                .then(() => {
                    if (fields.indexOf('questions') >= 0) {
                        filterPatch.questions.forEach(({ id, answers }) => {
                            const type = hxQuestion.serverById(id).type;
                            if (type === 'choices') {
                                answers.forEach((p) => {
                                    if (Object.keys(p).length === 1) {
                                        p.boolValue = true;
                                    }
                                });
                            }
                        });
                    }
                    Object.assign(server, filterPatch);
                });
        };
    }
};

const SpecTests = class FilterSpecTests extends FilterTests {
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
                    const fields = ['id', 'name', 'createdAt'];
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

    patchFilterPx(id, filterPatch) { // eslint-disable-line class-methods-use-this
        return models.filter.patchFilter(id, filterPatch);
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

const IntegrationTests = class FilterIntegrationTests extends FilterTests {
    constructor(rrSuperTest, hxQuestion) {
        super(hxQuestion);
        this.rrSuperTest = rrSuperTest;
    }

    createFilterFn(options = {}) {
        const rrSuperTest = this.rrSuperTest;
        const filterGenerator = this.filterGenerator;
        const hxFilter = this.hxFilter;
        const hxQuestion = this.hxQuestion;
        return function createFilter() {
            const filter = options.filter || filterGenerator.newFilter(hxQuestion);
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
                    const fields = ['id', 'name', 'createdAt'];
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

    patchFilterPx(id, filterPatch) {
        const rrSuperTest = this.rrSuperTest;
        return rrSuperTest.patch(`/filters/${id}`, filterPatch, 204);
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
