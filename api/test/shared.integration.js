/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');

const SharedIntegration = require('./util/shared-integration.js');
const RRSuperTest = require('./util/rr-super-test');

const models = require('../models');
const config = require('../config');
const SPromise = require('../lib/promise');

const language = models.language;

const expect = chai.expect;
const shared = new SharedIntegration();

describe('shared integration', function () {
    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    it('error: unknown end point', function (done) {
        store.get('/xxxxxxx', false, 404).end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: unexpected run time error', function (done) {
        sinon.stub(language, 'listLanguages', function () {
            return SPromise.reject(new Error('unexpected error'));
        });
        store.get('/languages', true, 500)
            .expect(function (res) {
                expect(res.body.message).to.deep.equal('unexpected error');
                language.listLanguages.restore();
            })
            .end(done);
    });

    it('error: unknown end point (authorized)', function (done) {
        store.get('/unknown', true, 404).end(done);
    });

    it('logout as super', shared.logoutFn(store));
});
