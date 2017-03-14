/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const History = require('./util/history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('registry unit', function registryUnit() {
    const hxRegistry = new History();

    before(shared.setUpFn());

    it('list all registries when none', function listRegistriesWhenNone() {
        return models.registry.listRegistries()
            .then((registries) => {
                expect(registries).to.have.length(0);
            });
    });

    const createRegistryFn = function (newRegistry) {
        return function createRegistry() {
            const registry = newRegistry || generator.newRegistry();
            return models.registry.createRegistry(registry)
                .then(({ id }) => hxRegistry.push(registry, { id }));
        };
    };

    const getRegistryFn = function (index) {
        return function getRegistry() {
            const id = hxRegistry.id(index);
            return models.registry.getRegistry(id)
                .then((registry) => {
                    hxRegistry.updateServer(index, registry);
                    comparator.registry(hxRegistry.client(index), registry);
                });
        };
    };

    const listRegistriesFn = function () {
        return function listRegistry() {
            return models.registry.listRegistries()
                .then((registries) => {
                    let expected = _.cloneDeep(hxRegistry.listServers(['id', 'name']));
                    expected = _.sortBy(expected, 'name');
                    expect(registries).to.deep.equal(expected);
                });
        };
    };

    const deleteRegistryFn = function (index) {
        return function deleteRegistry() {
            const id = hxRegistry.id(index);
            return models.registry.deleteRegistry(id)
                .then(() => hxRegistry.remove(index));
        };
    };

    _.range(8).forEach((index) => {
        it(`create registry ${index}`, createRegistryFn());
        it(`get registry ${index}`, getRegistryFn(index));
    });

    it('list registries', listRegistriesFn());

    it('error: create registry with url and schema', function createRegistryURLSchema() {
        const name = 'example';
        const registry = {name, url: 'https://example.com', schema: 'schema'};
        return models.registry.createRegistry(registry)
            .then(shared.throwingHandler)
            .catch(shared.expectedErrorHandler('registryBothURLSchema', name));
    });

    it('error: create registry with same name', function errorSameName() {
        const registry = generator.newRegistry();
        const name = hxRegistry.server(1).name;
        registry.name = name;
        return models.registry.createRegistry(registry)
            .then(shared.throwingHandler)
            .catch(shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', { name }));
    });

    it('error: create registry with same url', function errorSameUrl() {
        const registry = generator.newRegistry();
        const url = hxRegistry.server(1).url || hxRegistry.server(2).url;
        registry.url = url;
        return models.registry.createRegistry(registry)
            .then(shared.throwingHandler)
            .catch(shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', { url }));
    });

    it('error: create registry with same schema', function errorSameSchema() {
        const registry = generator.newRegistry();
        const schema = hxRegistry.server(1).schema || hxRegistry.server(2).schema;
        registry.schema = schema;
        return models.registry.createRegistry(registry)
            .then(shared.throwingHandler)
            .catch(shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', { schema }));
    });

    [1, 2, 5].forEach(index => {
        it(`delete registry ${index}`, deleteRegistryFn(index));
    });

    _.range(8, 10).forEach((index) => {
        it(`create registry ${index}`, createRegistryFn());
        it(`get registry ${index}`, getRegistryFn(index));
    });

    const createRegistryFromDeletedFn = function(deletedIndex) {
        return function createRegistryFromDeleted() {
            const server = hxRegistry.server(deletedIndex);
            delete server.id;
            return createRegistryFn(server)();
        };
    };

    [1, 2, 5].forEach((deletedIndex, index) => {
        const newIndex = 10 + index;
        const msg = `create registry ${newIndex} from deleted ${deletedIndex}`;
        it(msg, createRegistryFromDeletedFn(deletedIndex));
        it(`get registry ${newIndex}`, getRegistryFn(newIndex));
    });

    it('list registries', listRegistriesFn());
});
