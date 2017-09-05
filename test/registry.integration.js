/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const RRSuperTest = require('./util/rr-super-test');
const SharedIntegration = require('./util/shared-integration.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');

describe('registry integration', function registryIntegration() {
    const expect = chai.expect;
    const generator = new Generator();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxRegistry = new History();
    const tests = new registryCommon.IntegrationTests(rrSuperTest, generator, hxRegistry);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    it('list all registries when none', function listRegistriesWhenNone() {
        return rrSuperTest.get('/registries', true, 200)
            .expect((res) => {
                expect(res.body).to.have.length(0);
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
        return rrSuperTest.post('/registries', registry, 400);
    });

    it('error: create registry with same name', function errorSameName() {
        const registry = generator.newRegistry();
        const name = hxRegistry.server(1).name;
        registry.name = name;
        return rrSuperTest.post('/registries', registry, 400)
            .expect(res => shared.verifyErrorMessage(res, 'genericUnique', 'name', name));
    });

    it('error: create registry with same url', function errorSameUrl() {
        const registry = generator.newRegistry();
        const url = hxRegistry.server(1).url || hxRegistry.server(2).url;
        registry.url = url;
        return rrSuperTest.post('/registries', registry, 400)
            .expect(res => shared.verifyErrorMessage(res, 'genericUnique', 'url', url));
    });

    it('error: create registry with same schema', function errorSameSchema() {
        const registry = generator.newRegistry();
        const schema = hxRegistry.server(1).schema || hxRegistry.server(2).schema;
        registry.schema = schema;
        return rrSuperTest.post('/registries', registry, 400)
            .expect(res => shared.verifyErrorMessage(res, 'genericUnique', 'schema', schema));
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

    it('logout as super', shared.logoutFn());
});
