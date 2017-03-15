'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const comparator = require('./comparator');

const expect = chai.expect;

const SpecTests = class SurveySpecTests {
    constructor(generator, hxRegistry) {
        this.generator = generator;
        this.hxRegistry = hxRegistry;
    }

    createRegistryFn(newRegistry) {
        const generator = this.generator;
        const hxRegistry = this.hxRegistry;
        return function createRegistry() {
            const registry = newRegistry || generator.newRegistry();
            return models.registry.createRegistry(registry)
                .then(({ id }) => hxRegistry.push(registry, { id }));
        };
    }

    getRegistryFn(index) {
        const hxRegistry = this.hxRegistry;
        return function getRegistry() {
            const id = hxRegistry.id(index);
            return models.registry.getRegistry(id)
                .then((registry) => {
                    hxRegistry.updateServer(index, registry);
                    comparator.registry(hxRegistry.client(index), registry);
                });
        };
    }

    listRegistriesFn() {
        const hxRegistry = this.hxRegistry;
        return function listRegistry() {
            return models.registry.listRegistries()
                .then((registries) => {
                    let expected = _.cloneDeep(hxRegistry.listServers(['id', 'name']));
                    expected = _.sortBy(expected, 'name');
                    expect(registries).to.deep.equal(expected);
                });
        };
    }

    deleteRegistryFn(index) {
        const hxRegistry = this.hxRegistry;
        return function deleteRegistry() {
            const id = hxRegistry.id(index);
            return models.registry.deleteRegistry(id)
                .then(() => hxRegistry.remove(index));
        };
    }
};

const IntegrationTests = class SurveyIntegrationTests {
    constructor(rrSuperTest, generator, hxRegistry) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxRegistry = hxRegistry;
    }

    createRegistryFn(newRegistry) {
        const rrSuperTest = this.rrSuperTest;
        const generator = this.generator;
        const hxRegistry = this.hxRegistry;
        return function createRegistry() {
            const registry = newRegistry || generator.newRegistry();
            return rrSuperTest.post('/registries', registry, 201)
                .expect(res => hxRegistry.push(registry, res.body));
        };
    }

    getRegistryFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxRegistry = this.hxRegistry;
        return function getRegistry() {
            const id = hxRegistry.id(index);
            return rrSuperTest.get(`/registries/${id}`, true, 200)
                .expect((res) => {
                    hxRegistry.updateServer(index, res.body);
                    comparator.registry(hxRegistry.client(index), res.body);
                });
        };
    }

    listRegistriesFn() {
        const rrSuperTest = this.rrSuperTest;
        const hxRegistry = this.hxRegistry;
        return function listRegistry() {
            return rrSuperTest.get('/registries', true, 200)
                .expect((res) => {
                    let expected = _.cloneDeep(hxRegistry.listServers(['id', 'name']));
                    expected = _.sortBy(expected, 'name');
                    expect(res.body).to.deep.equal(expected);
                });
        };
    }

    deleteRegistryFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxRegistry = this.hxRegistry;
        return function deleteRegistry() {
            const id = hxRegistry.id(index);
            return rrSuperTest.delete(`/registries/${id}`, 204)
                .then(() => hxRegistry.remove(index));
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
