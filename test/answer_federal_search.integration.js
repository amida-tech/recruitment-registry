/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const models = require('../models');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const sequelizeGenerator = require('../models/db/sequelize-generator');
const modelsGenerator = require('../models/generator');
const searchCommon = require('./util/search/search-common');

const expect = chai.expect;

describe('federal search unit', function federalSearchUnit() {
    const { sequelize: publicSequelize } = sequelizeGenerator();

    const registries = _.range(2).map(index => ({ name: `name_${index}`, schema: `schema_${index}` }));

    it('drop all schemas', function dropAllSchemas() {
        return publicSequelize.dropAllSchemas();
    });

    const searchTestsMap = new Map();

    registries.forEach(({ schema }, index) => {
        it(`create schema ${schema}`, function createSchema() {
            return publicSequelize.createSchema(schema);
        });

        it(`start running search tests for ${schema}`, function startSchemaRun() {});

        const m = modelsGenerator(schema);
        const searchTests = new searchCommon.SpecTests(m, index * 7);
        searchTestsMap.set(schema, searchTests);
        searchTests.runAnswerSearchUnit();

        it(`end running search tests for ${schema}`, function endSchemaRun() {});
    });

    const generator = new Generator();
    const hxRegistry = new History();
    const registryTests = new registryCommon.SpecTests(generator, hxRegistry);
    const searchTests = new searchCommon.SpecTests();
    searchTests.runAnswerSearchUnit();

    registries.forEach((registry, index) => {
        it(`create registry ${index}`, registryTests.createRegistryFn(registry));
        it(`get registry ${index}`, registryTests.getRegistryFn(index));
    });

    it('federal search case 0', function federalSearch() {
        const schema0 = registries[0].schema;
        const schema1 = registries[1].schema;
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
        return models.answer.federalSearchCountUsers(federalCriteria)
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
