'use strict';

const chai = require('chai');

const models = require('../../models');
const comparator = require('./comparator');

const expect = chai.expect;

const SpecTests = class EnumerationSpecTests {
    constructor(generator, hxEnumeration) {
        this.generator = generator;
        this.hxEnumeration = hxEnumeration;
    }

    createChoiceSetFn() {
        const generator = this.generator;
        const hxEnumeration = this.hxEnumeration;
        return function () {
            const enumeration = generator.newEnumeration();
            return models.choiceSet.createChoiceSet(enumeration)
                .then(({ id }) => hxEnumeration.push(enumeration, { id }));
        };
    }

    getChoiceSetFn(index) {
        const hxEnumeration = this.hxEnumeration;
        return function () {
            const id = hxEnumeration.id(index);
            return models.choiceSet.getChoiceSet(id)
                .then(enumeration => {
                    hxEnumeration.updateServer(index, enumeration);
                    comparator.enumeration(hxEnumeration.client(index), enumeration);
                });
        };
    }

    deleteChoiceSetFn(index) {
        const hxEnumeration = this.hxEnumeration;
        return function () {
            const id = hxEnumeration.id(index);
            return models.choiceSet.deleteChoiceSet(id)
                .then(() => {
                    hxEnumeration.remove(index);
                });
        };
    }

    listChoiceSetsFn() {
        const hxEnumeration = this.hxEnumeration;
        return function () {
            return models.choiceSet.listChoiceSets()
                .then(enumerations => {
                    const expected = hxEnumeration.listServers(['id', 'reference']);
                    expect(enumerations).to.deep.equal(expected);
                });
        };
    }
};

const IntegrationTests = class EnumerationIntegrationTests {
    constructor(rrSuperTest, generator, hxEnumeration) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxEnumeration = hxEnumeration;
    }

    createChoiceSetFn() {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxEnumeration = this.hxEnumeration;
        return function (done) {
            const enumeration = generator.newEnumeration();
            rrSuperTest.post('/enumerations', enumeration, 201)
                .expect(function (res) {
                    hxEnumeration.push(enumeration, res.body);
                })
                .end(done);
        };
    }

    getChoiceSetFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxEnumeration = this.hxEnumeration;
        return function (done) {
            const id = hxEnumeration.id(index);
            rrSuperTest.get(`/enumerations/${id}`, true, 200)
                .expect(function (res) {
                    hxEnumeration.updateServer(index, res.body);
                    comparator.enumeration(hxEnumeration.client(index), res.body);
                })
                .end(done);
        };
    }

    deleteChoiceSetFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxEnumeration = this.hxEnumeration;
        return function (done) {
            const id = hxEnumeration.id(index);
            rrSuperTest.delete(`/enumerations/${id}`, 204)
                .expect(function () {
                    hxEnumeration.remove(index);
                })
                .end(done);
        };
    }

    listChoiceSetsFn() {
        const rrSuperTest = this.rrSuperTest;
        const hxEnumeration = this.hxEnumeration;
        return function (done) {
            rrSuperTest.get('/enumerations', true, 200)
                .expect(function (res) {
                    const expected = hxEnumeration.listServers(['id', 'reference']);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests
};
