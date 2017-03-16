/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const sequelizeGenerator = require('../models/db/sequelize-generator');
const modelsGenerator = require('../models/generator');
const searchCommon = require('./util/search/search-common');

describe('federal search unit', function federalSearchUnit() {
    const { sequelize: publicSequelize } = sequelizeGenerator();
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxRegistry = new History();
    const registryTests = new registryCommon.SpecTests(generator, hxRegistry);

    const registries = _.range(2).map(index => ({ name: `name_${index}`, schema: `schema_${index}` }));

    it('drop all schemas', function dropAllSchemas() {
        return publicSequelize.dropAllSchemas();
    });

    registries.forEach(({ schema }) => {
        it(`create schema ${schema}`, function createSchema() {
            return publicSequelize.createSchema(schema);
        });

        it(`start running search tests for ${schema}`, function startSchemaRun() {});

        const models = modelsGenerator(schema);
        const searchTests = new searchCommon.SpecTests(models);
        searchTests.runAnswerSearchUnit();

        it(`end running search tests for ${schema}`, function endSchemaRun() {});
    });

    it('sync models', shared.setUpFn());

    registries.forEach((registry, index) => {
        it(`create registry ${index}`, registryTests.createRegistryFn(registry));
        it(`get registry ${index}`, registryTests.getRegistryFn(index));
    });

    const searchTests = new searchCommon.SpecTests();
    searchTests.runAnswerSearchUnit();
});
