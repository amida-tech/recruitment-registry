/* global describe,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const path = require('path');
const chai = require('chai');
const fs = require('fs');

const config = require('../config');

const tokener = require('../lib/tokener');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const federatedCommon = require('./util/search/federated-search-common');
const SharedIntegration = require('./util/shared-integration');
const testCase0 = require('./util/search/test-case-0');

const expect = chai.expect;

describe('federated search integration', function federatedSearchIntegration() {
    const tests = new federatedCommon.IntegrationTests();

    describe('prepare system', tests.prepareSystemFn());

    tests.dbs.forEach((dbName) => {
        const searchTests = tests.searchTestsMap.get(dbName);
        describe(`set up ${dbName} via search tests`, searchTests.answerSearchUnitFn());
    });

    tests.schemas.forEach((schema) => {
        const searchTests = tests.searchTestsMap.get(schema);
        describe(`set up ${schema} via search tests`, searchTests.answerSearchIntegrationFn());
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
    const rrSuperTest = tests.rrSuperTest;
    const registryTests = new registryCommon.IntegrationTests(rrSuperTest, generator, hxRegistry);

    const shared = new SharedIntegration(rrSuperTest);

    describe('federated', function federated() {
        it('login as super', shared.loginFn(config.superUser));

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
            return rrSuperTest.post('/answers/federated-queries', criteria, 200)
                .then(res => expect(res.body.count).to.equal(count + count0 + count1 + count2 + count3));
        });

        const store = {};
        it('create filter', function createFilter() {
            const filter = { name: 'name_999', maxCount: 5 };
            const searchTestsMap = tests.searchTestsMap;
            const searchTests = searchTestsMap.get('current');
            Object.assign(filter, searchTests.formCriteria(testCase0.searchCases[0].answers));
            return rrSuperTest.post('/filters', filter, 201)
                .then((res) => { store.id = res.body.id; });
        });

        const generatedDirectory = path.join(__dirname, './generated');

        it('create cohort', function createCohort() {
            const filepath = path.join(generatedDirectory, 'cohort_federated.csv');
            const payload = { filterId: store.id, count: 10000, federated: true };
            return rrSuperTest.post('/cohorts', payload, 201)
                .then(res => fs.writeFileSync(filepath, res.text));
        });

        it('logout as super', shared.logoutFn());
    });

    describe('clean system', function cleanSystem() {
        it('close connections', function closeSequelize() {
            const m = tests.rrSuperTest.app.locals.models;
            return m.sequelize.close();
        });

        tests.dbs.forEach((dbName) => {
            it(`close server ${dbName} sequelize`, tests.closeServerSequelizeFn(dbName));
            it(`close server ${dbName}`, tests.closeServerFn(dbName));
        });
    });
});