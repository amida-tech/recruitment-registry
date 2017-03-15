/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const registryCommon = require('./util/registry-common');

describe('federal search unit', function federalSearchUnit() {
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxRegistry = new History();
    const registryTests = new registryCommon.SpecTests(generator, hxRegistry);

    before(shared.setUpFn());

    _.range(3).forEach((index) => {
        const registry = { name: `name_${index}`, schema: `schema_${index}` };
        it(`create registry ${index}`, registryTests.createRegistryFn(registry));
        it(`get registry ${index}`, registryTests.getRegistryFn(index));
    });
});
