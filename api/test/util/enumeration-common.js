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

    createEnumerationFn() {
        const generator = this.generator;
        const hxEnumeration = this.hxEnumeration;
        return function () {
            const enumeration = generator.newEnumeration();
            return models.enumeration.createEnumeration(enumeration)
                .then(({ id }) => hxEnumeration.push(enumeration, { id }));
        };
    }

    getEnumerationFn(index) {
        const hxEnumeration = this.hxEnumeration;
        return function () {
            const id = hxEnumeration.id(index);
            return models.enumeration.getEnumeration(id)
                .then(enumeration => {
                    hxEnumeration.updateServer(index, enumeration);
                    comparator.enumeration(hxEnumeration.client(index), enumeration);
                });
        };
    }

    deleteEnumerationFn(index) {
        const hxEnumeration = this.hxEnumeration;
        return function () {
            const id = hxEnumeration.id(index);
            return models.enumeration.deleteEnumeration(id)
                .then(() => {
                    hxEnumeration.remove(index);
                });
        };
    }

    listEnumerationsFn() {
        const hxEnumeration = this.hxEnumeration;
        return function () {
            return models.enumeration.listEnumerations()
                .then(enumerations => {
                    const expected = hxEnumeration.listServers(['id', 'name']);
                    expect(enumerations).to.deep.equal(expected);
                });
        };
    }
};

module.exports = {
    SpecTests
};
