'use strict';

const chai = require('chai');

const models = require('../../models');
const comparator = require('./comparator');

const expect = chai.expect;

const SpecTests = class ChoiceSetSpecTests {
    constructor(generator, hxChoiceSet) {
        this.generator = generator;
        this.hxChoiceSet = hxChoiceSet;
    }

    createChoiceSetFn() {
        const generator = this.generator;
        const hxChoiceSet = this.hxChoiceSet;
        return function () {
            const enumeration = generator.newEnumeration();
            return models.choiceSet.createChoiceSet(enumeration)
                .then(({ id }) => hxChoiceSet.push(enumeration, { id }));
        };
    }

    getChoiceSetFn(index) {
        const hxChoiceSet = this.hxChoiceSet;
        return function () {
            const id = hxChoiceSet.id(index);
            return models.choiceSet.getChoiceSet(id)
                .then(enumeration => {
                    hxChoiceSet.updateServer(index, enumeration);
                    comparator.enumeration(hxChoiceSet.client(index), enumeration);
                });
        };
    }

    deleteChoiceSetFn(index) {
        const hxChoiceSet = this.hxChoiceSet;
        return function () {
            const id = hxChoiceSet.id(index);
            return models.choiceSet.deleteChoiceSet(id)
                .then(() => {
                    hxChoiceSet.remove(index);
                });
        };
    }

    listChoiceSetsFn() {
        const hxChoiceSet = this.hxChoiceSet;
        return function () {
            return models.choiceSet.listChoiceSets()
                .then(enumerations => {
                    const expected = hxChoiceSet.listServers(['id', 'reference']);
                    expect(enumerations).to.deep.equal(expected);
                });
        };
    }
};

const IntegrationTests = class EnumerationIntegrationTests {
    constructor(rrSuperTest, generator, hxChoiceSet) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxChoiceSet = hxChoiceSet;
    }

    createChoiceSetFn() {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function (done) {
            const enumeration = generator.newEnumeration();
            rrSuperTest.post('/choice-sets', enumeration, 201)
                .expect(function (res) {
                    hxChoiceSet.push(enumeration, res.body);
                })
                .end(done);
        };
    }

    getChoiceSetFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function (done) {
            const id = hxChoiceSet.id(index);
            rrSuperTest.get(`/choice-sets/${id}`, true, 200)
                .expect(function (res) {
                    hxChoiceSet.updateServer(index, res.body);
                    comparator.enumeration(hxChoiceSet.client(index), res.body);
                })
                .end(done);
        };
    }

    deleteChoiceSetFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function (done) {
            const id = hxChoiceSet.id(index);
            rrSuperTest.delete(`/choice-sets/${id}`, 204)
                .expect(function () {
                    hxChoiceSet.remove(index);
                })
                .end(done);
        };
    }

    listChoiceSetsFn() {
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function (done) {
            rrSuperTest.get('/choice-sets', true, 200)
                .expect(function (res) {
                    const expected = hxChoiceSet.listServers(['id', 'reference']);
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
