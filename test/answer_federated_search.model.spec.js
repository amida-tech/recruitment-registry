/* global describe,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');

const tokener = require('../lib/tokener');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const federatedCommon = require('./util/search/federated-search-common');

const expect = chai.expect;

describe('federated search unit', function federatedSearchUnit() {
    const tests = new federatedCommon.SpecTests();

    describe('prepare system', tests.prepareSystemFn());

    tests.schemas.forEach((schema) => {
        const searchTests = tests.searchTestsMap.get(schema);
        describe(`set up ${schema} via search tests`, searchTests.answerSearchUnitFn());
    });

    tests.dbs.forEach((dbName) => {
        const searchTests = tests.searchTestsMap.get(dbName);
        describe(`set up ${dbName} via search tests`, searchTests.answerSearchUnitFn());
    });

    describe('clean dbs', function cleanDbs() {
        it('close db0 sequelize', function closeDb0Sequelize() {
            return tests.modelsdb0.sequelize.close();
        });
        it('close db1 sequelize', function closeDb1Sequelize() {
            return tests.modelsdb1.sequelize.close();
        });
    });

    describe('start servers', function startServers() {
        tests.dbs.forEach((dbName) => {
            it(`start server ${dbName}`, tests.startServerFn(dbName));
        });
    });

    const generator = new Generator();
    const hxRegistry = new History();
    const registryTests = new registryCommon.SpecTests(generator, hxRegistry, tests.models.current);
    describe('federated', function federated() {
        tests.registries.forEach((registry, index) => {
            it(`create registry ${index}`, registryTests.createRegistryFn(registry));
            it(`get registry ${index}`, registryTests.getRegistryFn(index));
            if (registry.url) {
                it(`setup environment for registry ${registry.name}`, function setupEnvironment() {
                    const token = tokener.createJWT({ id: 1, originalUsername: 'super' });
                    const key = `RECREG_JWT_${registry.name}`;
                    process.env[key] = token;
                });
            }
        });

        it('search case 0', function federatedSearch() {
            const searchTestsMap = tests.searchTestsMap;
            const schema0 = tests.registries[0].schema;
            const schema1 = tests.registries[1].schema;
            const { count: count0 } = searchTestsMap.get(schema0).getFederatedCriteria(0);
            const { count: count1 } = searchTestsMap.get(schema1).getFederatedCriteria(0);
            const { count: count2 } = searchTestsMap.get('recregone').getFederatedCriteria(0);
            const { count: count3 } = searchTestsMap.get('recregtwo').getFederatedCriteria(0);
            const { count, federatedCriteria: criteria } = searchTestsMap.get('current').getFederatedCriteria(0);
            return tests.models.current.answer.federatedSearchCountUsers(tests.models, criteria)
                .then(result => expect(result.count).to.equal(count + count0 + count1 + count2 + count3));
        });
    });

    describe('clean system', function cleanSystem() {
        it('close current sequelize', function closeCurrentSequelize() {
            return tests.models.sequelize.close();
        });

        tests.dbs.forEach((dbName) => {
            it(`close server ${dbName} sequelize`, tests.closeServerSequelizeFn(dbName));
            it(`close server ${dbName}`, tests.closeServerFn(dbName));
        });
    });
});
