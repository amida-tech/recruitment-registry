/* global xdescribe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');
const sequelizeGenerator = require('../models/db/sequelize-generator');
const modelsGenerator = require('../models/generator');

xdescribe('federal search unit', function federalSearchUnit() {
    const { sequelize: publicSequelize } = sequelizeGenerator();
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxRegistry = new History();
    const registryTests = new registryCommon.SpecTests(generator, hxRegistry);

    const registries = _.range(2).map(index => ({ name: `name_${index}`, schema: `schema_${index}` }));

    it('drop all schemas', function dropAllSchemas() {
        return publicSequelize.dropAllSchemas();
    });

    const schemaModels = {};

    registries.forEach(({ schema }) => {
        it(`create schema ${schema}`, function createSchema() {
            return publicSequelize.createSchema(schema);
        });

        it(`sync registry for schema ${schema}`, function syncRegistry() {
            const models = modelsGenerator(schema);
            schemaModels[schema] = models;
            return models.sequelize.sync({ force: true });
        });
    });

    before(shared.setUpFn());

    registries.forEach((registry, index) => {
        it(`create registry ${index}`, registryTests.createRegistryFn(registry));
        it(`get registry ${index}`, registryTests.getRegistryFn(index));
    });
});
