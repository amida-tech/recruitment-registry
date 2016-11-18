/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');

const SharedIntegration = require('./util/shared-integration.js');

const models = require('../models');
const config = require('../config');
const SPromise = require('../lib/promise');

const language = models.language;

const expect = chai.expect;
const shared = new SharedIntegration();

describe('shared integration', function () {
    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    it('unexpected run time error', function (done) {
        sinon.stub(language, 'listLanguages', function () {
            return SPromise.reject(new Error('unexpected error'));
        });
        store.server
            .get('/api/v1.0/languages')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(500)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.deep.equal('unexpected error');
                language.listLanguages.restore();
                done();
            });
    });

    it('unknown end point', function (done) {
        store.server
            .get('/api/v1.0/unknown')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(404, done);
    });

    it('logout as super', shared.logoutFn(store));
});
