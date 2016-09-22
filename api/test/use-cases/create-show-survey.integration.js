/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const shared = require('../shared-integration');
const registryExamples = require('../fixtures/registry-examples');

const config = require('../../config');

describe('create-show-survey', function () {
    const registryExample = registryExamples[0];

    // -------- set up system (syncAndLoadAlzheimer)

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('login as super user', shared.loginFn(store, config.superUser));

    it('create registry', shared.postRegistryFn(store, registryExample));

    it('logout as super user', shared.logoutFn(store));

    // --------

    // -------- see only Alzhimers survey list

});
