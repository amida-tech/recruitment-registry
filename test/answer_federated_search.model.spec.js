/* global describe,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');
const intoStream = require('into-stream');

const tokener = require('../lib/tokener');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const federatedCommon = require('./util/search/federated-search-common');
const testCase0 = require('./util/search/test-case-0');
const ImportCSVConverter = require('../import/csv-converter.js');

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

        it('federated count search using federated criteria directly', function federatedSearchCount() {
            const searchTestsMap = tests.searchTestsMap;
            const schema0 = tests.registries[0].schema;
            const schema1 = tests.registries[1].schema;
            const { count: count0 } = searchTestsMap.get(schema0).getFederatedCriteria(0);
            const { count: count1 } = searchTestsMap.get(schema1).getFederatedCriteria(0);
            const { count: count2 } = searchTestsMap.get('recregone').getFederatedCriteria(0);
            const { count: count3 } = searchTestsMap.get('recregtwo').getFederatedCriteria(0);
            const { count, federatedCriteria: criteria } = searchTestsMap.get('current').getFederatedCriteria(0);
            return tests.models.current.answer.federatedCountParticipants(tests.models, criteria)
                .then(result => expect(result.count).to.equal(count + count0 + count1 + count2 + count3));
        });

        it('federated count', function federatedSearchCount() {
            const searchTestsMap = tests.searchTestsMap;
            const searchTests = searchTestsMap.get('current');
            const { count, criteria } = searchTests.getCriteria(0);
            const fedCriteria = Object.assign({ federated: true }, criteria);
            return tests.models.current.answer.countParticipants(fedCriteria, tests.models)
                .then(result => expect(result.count).to.equal(5 * count));
        });

        const store = {};
        it('create filter', function creteFilter() {
            const searchTestsMap = tests.searchTestsMap;
            const searchTests = searchTestsMap.get('current');
            return searchTests.createFilterFn(100, testCase0.searchCases[0], store)();
        });

        it('create cohort', function createCohort() {
            const searchTestsMap = tests.searchTestsMap;
            const searchTests = searchTestsMap.get('current');
            const cohortOptions = { limited: false, federated: true, federatedModels: tests.models };
            return searchTests.createCohortFn(store, cohortOptions)();
        });

        it('compare cohort', function compareCohort() {
            const fields = ['registryId', 'userId', 'questionText', 'questionChoiceText', 'identifier', 'value'];
            const converter = new ImportCSVConverter({ checkType: false });
            const streamFullExport = intoStream(store.cohort);
            return converter.streamToRecords(streamFullExport)
                .then((cohortResult) => {
                    const searchTestsMap = tests.searchTestsMap;
                    const searchTests = searchTestsMap.get('current');
                    const { userIndices } = testCase0.searchCases[0];
                    const answerSequence = testCase0.answerSequence;
                    const loneExpected = searchTests.federatedListAnswersExpected(answerSequence, userIndices);
                    const rawExpected = _.range(5).reduce((r, index) => {
                        const wr = loneExpected.map((p) => {
                            const row = Object.assign({ registryId: index.toString() }, p);
                            row.userId = row.userId.toString();
                            return row;
                        });
                        r.push(...wr);
                        return r;
                    }, []);
                    cohortResult.forEach((r) => {
                        ['identifier', 'value', 'questionChoiceText'].forEach((key) => {
                            if (!r[key]) {
                                delete r[key];
                            }
                        });
                    });
                    const expected = _.sortBy(rawExpected, fields);
                    const result = _.sortBy(cohortResult, fields);
                    expect(result).to.deep.equal(expected);
                });
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
