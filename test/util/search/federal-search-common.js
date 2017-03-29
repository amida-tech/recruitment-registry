/* global it*/

'use strict';

const _ = require('lodash');

const config = require('../../../config');
const models = require('../../../models');
const generator = require('../../../models/generator');
const searchCommon = require('./search-common');
const RRSuperTest = require('../rr-super-test');
const SharedIntegration = require('../shared-integration');

const Tests = class BaseTests {
    constructor() {
        this.registries = _.range(2).map((index) => {
            const registry = { name: `name_${index}`, schema: `schema_${index}` };
            return registry;
        });
        this.schemas = ['current'];
        this.registries.forEach(({ schema }) => this.schemas.push(schema));
    }

    prepareSystemFn() {
        const self = this;
        return function prepareSystem() {
            it('drop all schemas', function dropAllSchemas() {
                return models.sequelize.dropAllSchemas();
            });

            self.schemas.forEach((schema) => {
                it(`create schema ${schema}`, function createSchema() {
                    return models.sequelize.createSchema(schema);
                });
            });

            it(self.initMessage, self.initializeFn());
        };
    }
};

const SpecTests = class FederalSearchSpecTests extends Tests {
    constructor() {
        super();
        this.models = generator(this.schemas);
        this.initMessage = 'sync models';
        this.searchTestsMap = this.schemas.reduce((r, schema, index) => {
            const m = this.models[schema];
            const searchTests = new searchCommon.SpecTests(m, index * 7, 4, false);
            r.set(schema, searchTests);
            return r;
        }, new Map());
    }

    initializeFn() {
        const self = this;
        return function initialize() {
            return self.models.sequelize.sync({ force: true });
        };
    }
};

const IntegrationTests = class FederalSearchSpecTests extends Tests {
    constructor() {
        super();
        this.rrSuperTests = this.schemas.reduce((r, schema) => {
            const rrSuperTest = new RRSuperTest(`/${schema}`);
            r[schema] = rrSuperTest;
            return r;
        }, {});
        this.rrSuperTest = this.rrSuperTests.current;
        this.initMessage = 'initialize app';
        this.searchTestsMap = this.schemas.reduce((r, schema, index) => {
            const rrSuperTest = this.rrSuperTests[schema];
            const searchTests = new searchCommon.IntegrationTests(rrSuperTest, index * 7, 4, false);
            r.set(schema, searchTests);
            return r;
        }, new Map());
    }

    initializeFn() {
        const configClone = _.cloneDeep(config);
        configClone.db.schema = this.schemas.join('~');
        const options = { config: configClone, generatedb: true };
        const rrSuperTests = _.values(this.rrSuperTests);
        return SharedIntegration.setUpMultiFn(rrSuperTests, options);
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
