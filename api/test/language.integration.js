/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration.js');

const config = require('../config');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('language integration', function () {
    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    let languages;

    const listLanguagesFn = function (done) {
        store.server
            .get('/api/v1.0/languages')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.deep.equal(languages);
                done();
            });
    };

    it('login as super', shared.loginFn(store, config.superUser));

    it('list existing languages', function (done) {
        store.server
            .get('/api/v1.0/languages')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                languages = res.body;
                expect(languages).to.have.length.above(0);
                done();
            });
    });

    const example = {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe'
    };

    it('create language', function (done) {
        store.server
            .post('/api/v1.0/languages')
            .set('Authorization', store.auth)
            .send(example)
            .expect(201)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                languages.push(example);
                _.sortBy(languages, 'code');
                done();
            });
    });

    it('get language', function (done) {
        store.server
            .get(`/api/v1.0/languages/${example.code}`)
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.deep.equal(example);
                done();
            });
    });

    it('list existing languages', listLanguagesFn);

    it('delete language', function (done) {
        store.server
            .delete(`/api/v1.0/languages/fr`)
            .set('Authorization', store.auth)
            .expect(204)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                _.remove(languages, { code: 'fr' });
                done();
            });
    });

    it('list existing languages', listLanguagesFn);

    it('patch language', function (done) {
        const languageUpdate = { name: 'Turk', nativeName: 'Türk' };
        store.server
            .patch(`/api/v1.0/languages/tr`)
            .set('Authorization', store.auth)
            .send(languageUpdate)
            .expect(200)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                const language = _.find(languages, { code: 'tr' });
                Object.assign(language, languageUpdate);
                done();
            });
    });

    it('list existing languages', listLanguagesFn);
});
