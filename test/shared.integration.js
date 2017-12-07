/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

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

describe('shared integration', () => {
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest);

    before(shared.setUpFn());

    it('error: unknown end point', (done) => {
        rrSuperTest.get('/xxxxxxx', false, 404).end(done);
    });

    it('login as super', shared.loginFn(config.superUser));

    it('error: unexpected run time error', (done) => {
        sinon.stub(language, 'listLanguages', function listLanguages() {
            return SPromise.reject(new Error('unexpected error'));
        });
        rrSuperTest.get('/languages', true, 500)
            .expect((res) => {
                expect(res.body.message).to.deep.equal('unexpected error');
                language.listLanguages.restore();
            })
            .end(done);
    });

    it('error: unknown end point (authorized)', (done) => {
        rrSuperTest.get('/unknown', true, 404).end(done);
    });

    it('logout as super', shared.logoutFn());
});
