/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../config');

const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const modelsGenerator = require('../models/generator');
const searchCommon = require('./util/search/search-common');
const federalCommon = require('./util/search/federal-search-common');

const expect = chai.expect;

describe('federal search integration', function federalSearchIntegration() {
    const tests = new federalCommon.SpecTests();

    describe('prepare system', tests.prepareSystemFn());

    const searchTestsMap = new Map();
    const modelsMap = new Map();

    tests.registries.forEach(({ schema }, index) => {
        const m = modelsGenerator(schema);
        modelsMap.set(schema, m);
        const rrSuperTest = new RRSuperTest();
        const searchTests = new searchCommon.IntegrationTests(rrSuperTest, m, index * 7);
        searchTestsMap.set(schema, searchTests);
        describe(`set up ${schema} via search tests`, searchTests.answerSearchIntegrationFn());
    });

    describe('clean system', function cleanSystem() {
        tests.registries.forEach(({ schema }) => {
            it('close connections', function closeSequelize() {
                const m = modelsMap.get(schema);
                return m.sequelize.close();
            });
        });
    });

    const generator = new Generator();
    const hxRegistry = new History();
    const rrSuperTest = new RRSuperTest();
    const registryTests = new registryCommon.IntegrationTests(rrSuperTest, generator, hxRegistry);
    const searchTests = new searchCommon.IntegrationTests(rrSuperTest);
    describe('set up current via search tests', searchTests.answerSearchIntegrationFn());

    describe('federal', function federal() {
        it('login as super', searchTests.shared.loginFn(config.superUser));

        tests.registries.forEach((registry, index) => {
            it(`create registry ${index}`, registryTests.createRegistryFn(registry));
            it(`get registry ${index}`, registryTests.getRegistryFn(index));
        });

        it('federal search case 0', function federalSearch() {
            const schema0 = tests.registries[0].schema;
            const schema1 = tests.registries[1].schema;
            const { count: count0, criteria: criteria0 } = searchTestsMap.get(schema0).getCriteria(0);
            const { count: count1, criteria: criteria1 } = searchTestsMap.get(schema1).getCriteria(1);
            const { count, criteria } = searchTests.getCriteria(2);
            const federalCriteria = {
                local: { criteria },
                federal: [{
                    registryId: hxRegistry.id(0),
                    criteria: criteria0,
                }, {
                    registryId: hxRegistry.id(1),
                    criteria: criteria1,
                }],
            };
            return rrSuperTest.post('/answers/federal-queries', federalCriteria, 200)
                .expect((res) => {
                    const expected = {
                        local: { count },
                        federal: [{
                            count: count0,
                        }, {
                            count: count1,
                        }],
                        total: { count: count + count0 + count1 },
                    };
                    expect(res.body).to.deep.equal(expected);
                });
        });

        it('logout as super', searchTests.shared.logoutFn());
    });
});
