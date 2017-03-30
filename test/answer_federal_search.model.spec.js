/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const tokener = require('../lib/tokener');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const federalCommon = require('./util/search/federal-search-common');

const expect = chai.expect;

describe('federal search unit', function federalSearchUnit() {
    const tests = new federalCommon.SpecTests();

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
    describe('federal', function federal() {
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

        it('search case 0', function federalSearch() {
            const searchTestsMap = tests.searchTestsMap;
            const schema0 = tests.registries[0].schema;
            const schema1 = tests.registries[1].schema;
            const { count: count0, criteria: criteria0 } = searchTestsMap.get(schema0).getCriteria(0);
            const { count: count1, criteria: criteria1 } = searchTestsMap.get(schema1).getCriteria(1);
            const { count: count2, criteria: criteria2 } = searchTestsMap.get('recregone').getCriteria(0);
            const { count: count3, criteria: criteria3 } = searchTestsMap.get('recregtwo').getCriteria(1);
            const { count, criteria } = searchTestsMap.get('current').getCriteria(2);
            const federalCriteria = {
                local: { criteria },
                federal: [{
                    registryId: hxRegistry.id(0),
                    criteria: criteria0,
                }, {
                    registryId: hxRegistry.id(1),
                    criteria: criteria1,
                }, {
                    registryId: hxRegistry.id(2),
                    criteria: criteria2,
                }, {
                    registryId: hxRegistry.id(3),
                    criteria: criteria3,
                }],
            };
            return tests.models.current.answer.federalSearchCountUsers(tests.models, federalCriteria)
                .then((result) => {
                    const expected = {
                        local: { count },
                        federal: [{
                            count: count0,
                        }, {
                            count: count1,
                        }, {
                            count: count2,
                        }, {
                            count: count3,
                        }],
                        total: { count: count + count0 + count1 + count2 + count3 },
                    };
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
