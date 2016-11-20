/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration.js');
const RRSuperTest = require('./util/rr-super-test');

const config = require('../config');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('language integration', function () {
    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    let languages;

    const listLanguagesFn = function (done) {
        store.server
            .get('/api/v1.0/languages')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                expect(res.body).to.deep.equal(languages);
            })
            .end(done);
    };

    it('login as super', shared.loginFn(store, config.superUser));

    it('list existing languages', function (done) {
        store.server
            .get('/api/v1.0/languages')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                languages = res.body;
                expect(languages).to.have.length.above(0);
            })
            .end(done);
    });

    const example = {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe'
    };

    it('create language', function (done) {
        store.post('/languages', example, 201)
            .expect(function () {
                languages.push(example);
                _.sortBy(languages, 'code');
            })
            .end(done);
    });

    it('get language', function (done) {
        store.server
            .get(`/api/v1.0/languages/${example.code}`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                expect(res.body).to.deep.equal(example);
            })
            .end(done);
    });

    it('list existing languages', listLanguagesFn);

    it('delete language', function (done) {
        store.delete('/languages/fr', 204)
            .expect(function () {
                _.remove(languages, { code: 'fr' });
            })
            .end(done);
    });

    it('list existing languages', listLanguagesFn);

    it('patch language', function (done) {
        const languageUpdate = { name: 'Turk', nativeName: 'Türk' };
        store.patch('/languages/tr', languageUpdate, 204)
            .expect(function () {
                const language = _.find(languages, { code: 'tr' });
                Object.assign(language, languageUpdate);
            })
            .end(done);
    });

    it('list existing languages', listLanguagesFn);
});
