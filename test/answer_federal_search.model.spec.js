/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

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

    const generator = new Generator();
    const hxRegistry = new History();
    const registryTests = new registryCommon.SpecTests(generator, hxRegistry, tests.models.current);
    describe('federal', function federal() {
        tests.registries.forEach((registry, index) => {
            it(`create registry ${index}`, registryTests.createRegistryFn(registry));
            it(`get registry ${index}`, registryTests.getRegistryFn(index));
        });

        it('search case 0', function federalSearch() {
            const searchTestsMap = tests.searchTestsMap;
            const schema0 = tests.registries[0].schema;
            const schema1 = tests.registries[1].schema;
            const { count: count0, criteria: criteria0 } = searchTestsMap.get(schema0).getCriteria(0);
            const { count: count1, criteria: criteria1 } = searchTestsMap.get(schema1).getCriteria(1);
            const { count, criteria } = searchTestsMap.get('current').getCriteria(2);
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
            return tests.models.current.answer.federalSearchCountUsers(tests.models, federalCriteria)
                .then((result) => {
                    const expected = {
                        local: { count },
                        federal: [{
                            count: count0,
                        }, {
                            count: count1,
                        }],
                        total: { count: count + count0 + count1 },
                    };
                    expect(result).to.deep.equal(expected);
                });
        });
    });

    describe('clean system', function cleanSystem() {
        it('close current sequelize', function closeCurrentSequelize() {
            return tests.models.sequelize.close();
        });
    });
});
