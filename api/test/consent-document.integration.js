/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const Generator = require('./util/entity-generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const config = require('../config');
const RRError = require('../lib/rr-error');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('consent section integration', function () {
    const userCount = 4;

    const store = {
        server: null,
        auth: null
    };
    const history = new ConsentDocumentHistory(userCount);

    before(shared.setUpFn(store));

    const listConsentTypesFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/consent-types')
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const types = history.listTypes();
                    expect(res.body).to.deep.equal(types);
                    done();
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 2; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(store, history));
        it('get/verify consent types', listConsentTypesFn());
    }

    for (let i = 0; i < userCount; ++i) {
        const user = generator.newUser();
        it(`create user ${i}`, shared.createUserFn(store, history.hxUser, user));
    }

    it('logout as super', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, history.hxUser, 0));
    it('error: no consent sections of existing types', function (done) {
        store.server
            .get(`/api/v1.0/users/consent-documents`)
            .set('Authorization', store.auth)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.equal(RRError.message('noSystemConsentDocuments'));
                done();
            });
    });
    it('logout as user 0', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    const getConsentDocumentFn = function (typeIndex) {
        return function (done) {
            const id = history.id(typeIndex);
            store.server
                .get(`/api/v1.0/consent-documents/${id}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = history.server(typeIndex);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create consent section of type ${i}`, shared.createConsentDocumentFn(store, history, i));
        it(`get/verify consent section content of type ${i}`, getConsentDocumentFn(i));
    }

    const getUserConsentDocumentsFn = function (expectedIndices) {
        return function (done) {
            store.server
                .get('/api/v1.0/users/consent-documents')
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = history.serversInList(expectedIndices);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`login as user ${i}`, shared.loginIndexFn(store, history.hxUser, i));
        it(`verify consent sections required for user ${i}`, getUserConsentDocumentsFn([0, 1]));
        it(`user ${i} get consent section 0`, getConsentDocumentFn(0));
        it(`user ${i} get consent section 1`, getConsentDocumentFn(1));
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    const signConsentTypeFn = function (userIndex, typeIndex, language) {
        return function (done) {
            const consentDocumentId = history.id(typeIndex);
            const query = {};
            if (language) {
                query.language = language;
            }
            store.server
                .post(`/api/v1.0/consent-signatures`)
                .set('Authorization', store.auth)
                .query(query)
                .send({ consentDocumentId })
                .expect(201)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    history.sign(typeIndex, userIndex, language);
                    done();
                });
        };
    };

    const signConsentTypeAgainFn = function (typeIndex) {
        return function (done) {
            const consentDocumentId = history.id(typeIndex);
            store.server
                .post(`/api/v1.0/consent-signatures`)
                .set('Authorization', store.auth)
                .send({ consentDocumentId })
                .expect(400, done);
        };
    };

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent document 0', signConsentTypeFn(0, 0));
    it('user 0 signs consent document 1', signConsentTypeFn(0, 1));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent document again 0', signConsentTypeAgainFn(0));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it('user 1 signs consent document 0', signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document 1', signConsentTypeFn(1, 1, 'sp'));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it('user 2 signs consent document 1', signConsentTypeFn(2, 0));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it('user 3 signs consent document 0', signConsentTypeFn(3, 1));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it(`verify consent sections required for user 0`, getUserConsentDocumentsFn([]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it(`verify consent sections required for user 1`, getUserConsentDocumentsFn([]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it(`verify consent sections required for user 2`, getUserConsentDocumentsFn([1]));
    it(`user 2 get consent section 1`, getConsentDocumentFn(1));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it(`verify consent sections required for user 3`, getUserConsentDocumentsFn([0]));
    it(`user 3 get consent section 0`, getConsentDocumentFn(0));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it('add a new consent type', shared.createConsentTypeFn(store, history));
    it('create/verify consent section of type 2', shared.createConsentDocumentFn(store, history, 2));
    it('logout as super', shared.logoutFn(store));

    const signConsentType = ((userIndex, consentDocumentIndex, language) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(store, history.hxUser, userIndex));
        it(`user ${userIndex} signs consent document ${consentDocumentIndex}`, signConsentTypeFn(userIndex, consentDocumentIndex, language));
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    const verifyConsentDocuments = ((userIndex, consentDocumentIndices) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(store, history.hxUser, userIndex));
        it(`verify consent sections required for user ${userIndex}`, getUserConsentDocumentsFn(consentDocumentIndices));
        for (let i = 0; i < consentDocumentIndices.length; ++i) {
            it(`user ${userIndex} get consent section ${i}`, getConsentDocumentFn(consentDocumentIndices[i]));
        }
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    verifyConsentDocuments(0, [2]);
    verifyConsentDocuments(1, [2]);
    verifyConsentDocuments(2, [1, 2]);
    verifyConsentDocuments(3, [0, 2]);

    signConsentType(2, 2, 'en');

    verifyConsentDocuments(2, [1]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify consent section of type 1', shared.createConsentDocumentFn(store, history, 1));
    it('logout as super', shared.logoutFn(store));

    verifyConsentDocuments(0, [1, 2]);
    verifyConsentDocuments(1, [1, 2]);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(1, 2, 'sp');
    verifyConsentDocuments(1, [1]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify consent section of type 0', shared.createConsentDocumentFn(store, history, 0));
    it('logout as super', shared.logoutFn(store));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(2, 1);
    signConsentType(3, 1);

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify consent section of type 1', shared.createConsentDocumentFn(store, history, 1));
    it('logout as super', shared.logoutFn(store));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(0, 1, 'en');
    verifyConsentDocuments(0, [0, 2]);
    signConsentType(0, 2, 'sp');
    verifyConsentDocuments(0, [0]);
    signConsentType(0, 0);
    verifyConsentDocuments(0, []);

    const deleteConsentTypeFn = function (index) {
        return function (done) {
            const id = history.typeId(index);
            store.server
                .delete(`/api/v1.0/consent-types/${id}`)
                .set('Authorization', store.auth)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    history.deleteType(index);
                    done();
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    it('delete consent type 1', deleteConsentTypeFn(1));
    it('get/verify consent types', listConsentTypesFn());
    it('logout as super', shared.logoutFn(store));

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [0]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    const verifySignaturesFn = function (userIndex) {
        return function (done) {
            const userId = history.userId(userIndex);
            store.server
                .get(`/api/v1.0/consent-signatures/users/${userId}/history`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = _.sortBy(history.signatures[userIndex], 'id');
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 0; i < userCount; ++i) {
        it('verify signatures', verifySignaturesFn(i));
    }
    it('logout as super', shared.logoutFn(store));
});
