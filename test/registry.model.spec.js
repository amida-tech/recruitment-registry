/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');

describe('registry unit', function registryUnit() {
    const expect = chai.expect;
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxRegistry = new History();
    const tests = new registryCommon.SpecTests(generator, hxRegistry);

    before(shared.setUpFn());

    it('list all registries when none', function listRegistriesWhenNone() {
        return models.registry.listRegistries()
            .then((registries) => {
                expect(registries).to.have.length(0);
            });
    });

    _.range(8).forEach((index) => {
        it(`create registry ${index}`, tests.createRegistryFn());
        it(`get registry ${index}`, tests.getRegistryFn(index));
    });

    it('list registries', tests.listRegistriesFn());

    it('error: create registry with url and schema', function createRegistryURLSchema() {
        const name = 'example';
        const registry = { name, url: 'https://example.com', schema: 'schema' };
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

    [1, 2, 5].forEach((index) => {
        it(`delete registry ${index}`, tests.deleteRegistryFn(index));
    });

    _.range(8, 10).forEach((index) => {
        it(`create registry ${index}`, tests.createRegistryFn());
        it(`get registry ${index}`, tests.getRegistryFn(index));
    });

    const createRegistryFromDeletedFn = function (deletedIndex) {
        return function createRegistryFromDeleted() {
            const server = hxRegistry.server(deletedIndex);
            delete server.id;
            return tests.createRegistryFn(server)();
        };
    };

    [1, 2, 5].forEach((deletedIndex, index) => {
        const newIndex = 10 + index;
        const msg = `create registry ${newIndex} from deleted ${deletedIndex}`;
        it(msg, createRegistryFromDeletedFn(deletedIndex));
        it(`get registry ${newIndex}`, tests.getRegistryFn(newIndex));
    });

    it('list registries', tests.listRegistriesFn());
});
