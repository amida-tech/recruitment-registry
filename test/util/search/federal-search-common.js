/* global it*/

'use strict';

const _ = require('lodash');

const models = require('../../../models');

const Tests = class BaseTests {
    constructor() {
        this.registries = _.range(2).map((index) => {
            const registry = { name: `name_${index}`, schema: `schema_${index}` };
            return registry;
        });
    }

    prepareSystemFn() {
        const self = this;
        return function prepareSystem() {
            it('drop all schemas', function dropAllSchemas() {
                return models.sequelize.dropAllSchemas();
            });

            self.registries.forEach(({ schema }) => {
                it(`create schema ${schema}`, function createSchema() {
                    return models.sequelize.createSchema(schema);
                });
            });
        };
    }
};

const SpecTests = class FederalSearchSpecTests extends Tests {

};

const IntegrationTests = class FederalSearchSpecTests extends Tests {

};

module.exports = {
    SpecTests,
    IntegrationTests,
};
