/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const SharedIntegration = require('./util/shared-integration');
const Generator = require('./util/entity-generator');
const config = require('../config');
const History = require('./util/entity-history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('consent section integration', function () {
    const typeCount = 12;

    const store = {
        server: null,
        auth: null
    };

    const hxType = new History();

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    const createConsentTypeFn = function () {
        return function (done) {
            const cst = generator.newConsentType();
            store.server
                .post('/api/v1.0/consent-types')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send(cst)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxType.pushWithId(cst, res.body.id);
                    done();
                });
        };
    };

    const getConsentTypeFn = function (index) {
        return function (done) {
            const consentType = hxType.server(index);
            store.server
                .get(`/api/v1.0/consent-types/${consentType.id}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.deep.equal(consentType);
                    done();
                });
        };
    };

    const listConsentTypesFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/consent-types')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = hxType.listServers();
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    for (let i = 0; i < typeCount; ++i) {
        it(`create consent type ${i}`, createConsentTypeFn(hxType));
        it(`get and verify consent type ${i}`, getConsentTypeFn(i));
    }

    it('list consent types and verify', listConsentTypesFn());

    const getTranslatedConsentTypeFn = function (index, language) {
        return function (done) {
            const id = hxType.id(index);
            store.server
                .get(`/api/v1.0/consent-types/${id}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ language })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = hxType.translatedServer(index, language);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    const listTranslatedConsentTypesFn = function (language) {
        return function (done) {
            store.server
                .get('/api/v1.0/consent-types')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ language })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = hxType.listTranslatedServers(language);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    it('get consent type 3 in spanish when no name translation', getTranslatedConsentTypeFn(3, 'es'));

    it('list consent types in spanish when no translation', listTranslatedConsentTypesFn('es'));

    for (let i = 0; i < typeCount; ++i) {
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(store, i, 'es', hxType));
        it(`get and verify tanslated consent type ${i}`, getTranslatedConsentTypeFn(i, 'es'));
    }

    it('list and verify translated (es) consent types', listTranslatedConsentTypesFn('es'));

    for (let i = 0; i < typeCount; i += 2) {
        it(`add translated (fr) consent type ${i}`, shared.translateConsentTypeFn(store, i, 'fr', hxType));
        it(`get and verify tanslated (fr) consent type ${i}`, getTranslatedConsentTypeFn(i, 'fr'));
    }

    it('list and verify translated (fr) consent types', listTranslatedConsentTypesFn('fr'));

    it('list consent types in english (original)', listTranslatedConsentTypesFn('en'));

    it('logout as super', shared.logoutFn(store));
});
