/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const RRError = require('../lib/rr-error');
const RRSuperTest = require('./util/rr-super-test');
const SharedIntegration = require('./util/shared-integration.js');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const History = require('./util/history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('registry integration', function registryIntegration() {
    const rrSuperTest = new RRSuperTest();
    const hxRegistry = new History();

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    it('list all registries when none', function listRegistriesWhenNone() {
        return rrSuperTest.get('/registries', true, 200)
            .expect((res) => {
                expect(res.body).to.have.length(0);
            });
    });

    const createRegistryFn = function (newRegistry) {
        return function createRegistry() {
            const registry = newRegistry || generator.newRegistry();
            return rrSuperTest.post('/registries', registry, 201)
                .expect(res => hxRegistry.push(registry, res.body));
        };
    };

    const getRegistryFn = function (index) {
        return function getRegistry() {
            const id = hxRegistry.id(index);
            return rrSuperTest.get(`/registries/${id}`, true, 200)
                .expect((res) => {
                    hxRegistry.updateServer(index, res.body);
                    comparator.registry(hxRegistry.client(index), res.body);
                });
        };
    };

    const listRegistriesFn = function () {
        return function listRegistry() {
            return rrSuperTest.get('/registries', true, 200)
                .expect((res) => {
                    let expected = _.cloneDeep(hxRegistry.listServers(['id', 'name']));
                    expected = _.sortBy(expected, 'name');
                    expect(res.body).to.deep.equal(expected);
                });
        };
    };

    const deleteRegistryFn = function (index) {
        return function deleteRegistry() {
            const id = hxRegistry.id(index);
            return rrSuperTest.delete(`/registries/${id}`, 204)
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
        const registry = { name, url: 'https://example.com', schema: 'schema' };
        return rrSuperTest.post('/registries', registry, 400);
    });

    it('error: create registry with same name', function errorSameName() {
        const registry = generator.newRegistry();
        const name = hxRegistry.server(1).name;
        registry.name = name;
        return rrSuperTest.post('/registries', registry, 400)
            .expect((res) => {
                const message = RRError.message('genericUnique', 'name', name);
                expect(res.body.message).to.equal(message);
            });
    });

    it('error: create registry with same url', function errorSameUrl() {
        const registry = generator.newRegistry();
        const url = hxRegistry.server(1).url || hxRegistry.server(2).url;
        registry.url = url;
        return rrSuperTest.post('/registries', registry, 400)
            .expect((res) => {
                const message = RRError.message('genericUnique', 'url', url);
                expect(res.body.message).to.equal(message);
            });
    });

    it('error: create registry with same schema', function errorSameSchema() {
        const registry = generator.newRegistry();
        const schema = hxRegistry.server(1).schema || hxRegistry.server(2).schema;
        registry.schema = schema;
        return rrSuperTest.post('/registries', registry, 400)
            .expect((res) => {
                const message = RRError.message('genericUnique', 'schema', schema);
                expect(res.body.message).to.equal(message);
            });
    });

    [1, 2, 5].forEach((index) => {
        it(`delete registry ${index}`, deleteRegistryFn(index));
    });

    _.range(8, 10).forEach((index) => {
        it(`create registry ${index}`, createRegistryFn());
        it(`get registry ${index}`, getRegistryFn(index));
    });

    const createRegistryFromDeletedFn = function (deletedIndex) {
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

    it('logout as super', shared.logoutFn(rrSuperTest));
});
