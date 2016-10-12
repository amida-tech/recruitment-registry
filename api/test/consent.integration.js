/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-integration');
const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const ConsentDocumentHistory = require('./util/consent-document-history');
const ConsentCommon = require('./util/consent-common');
const config = require('../config');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('consent integration', function () {
    const userCount = 4;
    const typeCount = 12;

    const store = {
        server: null,
        auth: null
    };
    const history = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();
    const consentCommon = new ConsentCommon(hxConsent, history);

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < typeCount; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(store, history));
    }

    for (let i = 0; i < userCount; ++i) {
        const user = generator.newUser();
        it(`create user ${i}`, shared.createUserFn(store, history.hxUser, user));
    }

    const consentSpecs = [
        [0, 1, 2, 3, 4], // consent 0. Sections of types 0, 1, 2, 3, 4
        [8, 5, 10, 11], // consent 1. Sections of types 8, 5, 11, 12
        [2, 3, 6, 7], // consent 2. Sections of types 2, 3, 6, 7
        [8, 11, 9] // consent 3. Sections of types 8, 11, 9
    ];

    consentSpecs.forEach((typeIndices, index) => {
        it(`create consent ${index}`, function (done) {
            const sections = typeIndices.map(typeIndex => history.typeId(typeIndex));
            const clientConsent = generator.newConsent({ sections });
            store.server
                .post('/api/v1.0/consents')
                .set('Authorization', store.auth)
                .send(clientConsent)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxConsent.pushWithId(clientConsent, res.body.id);
                    done();
                });
        });
    });

    _.range(consentSpecs.length).forEach(index => {
        it(`get/verify consent ${index}`, function (done) {
            const id = hxConsent.id(index);
            store.server
                .get(`/api/v1.0/consents/${id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = hxConsent.server(index);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        });
    });

    _.range(consentSpecs.length).forEach(index => {
        it(`get/verify consent by name ${index}`, function (done) {
            const name = hxConsent.client(index).name;
            store.server
                .get(`/api/v1.0/consents/name/${name}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = hxConsent.server(index);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        });
    });

    const listConsentsFn = function (done) {
        store.server
            .get(`/api/v1.0/consents`)
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const expected = hxConsent.serverList();
                expect(res.body).to.deep.equal(expected);
                done();
            });
    };

    it('list/verify consents', listConsentsFn);

    it('delete consent 2', function (done) {
        const id = hxConsent.id(2);
        store.server
            .delete(`/api/v1.0/consents/${id}`)
            .set('Authorization', store.auth)
            .expect(204)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                hxConsent.remove(2);
                done();
            });
    });

    it('list/verify consents', listConsentsFn);

    it('logout as super', shared.logoutFn(store));

    const getUserConsentDocumentsFn = function (userIndex, index, signatureIndices) {
        return function (done) {
            const id = hxConsent.id(index);
            store.server
                .get(`/api/v1.0/consents/${id}/user-documents`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const typeIndices = consentSpecs[index];
                    const signatures = signatureIndices.reduce((r, i) => (r[i] = true, r), {});
                    const expected = consentCommon.formExpectedConsent(index, typeIndices, signatures);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    const getUserConsentDocumentsByNameFn = function (userIndex, index, signatureIndices) {
        return function (done) {
            const name = hxConsent.server(index).name;
            store.server
                .get(`/api/v1.0/consents/name/${name}/user-documents`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const typeIndices = consentSpecs[index];
                    const signatures = signatureIndices.reduce((r, i) => (r[i] = true, r), {});
                    const expected = consentCommon.formExpectedConsent(index, typeIndices, signatures);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 0; i < 3; ++i) {
        it(`create/verify consent document of type ${i}`, shared.createConsentDocumentFn(store, history, i));
    }
    it('logout as super', shared.logoutFn(store));

    const fn = (() => {
        [0, 1, 3].forEach(consentIndex => {
            it(`get/verify consent ${consentIndex} documents`, function (done) {
                const id = hxConsent.id(consentIndex);
                store.server
                    .get(`/api/v1.0/consents/${id}/documents`)
                    .set('Authorization', store.auth)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }
                        const typeIndices = consentSpecs[consentIndex];
                        const expected = consentCommon.formExpectedConsent(consentIndex, typeIndices);
                        expect(res.body).to.deep.equal(expected);
                        done();
                    });
            });

            it(`get/verify consent ${consentIndex} documents by name`, function (done) {
                const name = hxConsent.server(consentIndex).name;
                store.server
                    .get(`/api/v1.0/consents/name/${name}/documents`)
                    .set('Authorization', store.auth)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }
                        const typeIndices = consentSpecs[consentIndex];
                        const expected = consentCommon.formExpectedConsent(consentIndex, typeIndices);
                        expect(res.body).to.deep.equal(expected);
                        done();
                    });
            });

            _.range(userCount).forEach(userIndex => {
                it(`login as user ${userIndex}`, shared.loginIndexFn(store, history.hxUser, 0));
                it(`get/verify user consent ${consentIndex} documents`, getUserConsentDocumentsFn(userIndex, consentIndex, []));
                it(`get/verify user consent ${consentIndex} documents by name`, getUserConsentDocumentsByNameFn(userIndex, consentIndex, []));
                it(`logout as user ${userIndex}`, shared.logoutFn(store));
            });
        });
    });

    fn();

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 3; i < typeCount; ++i) {
        it(`create/verify consent document of type ${i}`, shared.createConsentDocumentFn(store, history, i));
    }
    it('logout as super', shared.logoutFn(store));

    fn();

    const signDocumentsFn = function (userIndex, index, newSignatureIndices) {
        return function (done) {
            const documentIds = newSignatureIndices.map(i => history.id(i));
            store.server
                .post(`/api/v1.0/consent-signatures/bulk`)
                .set('Authorization', store.auth)
                .send(documentIds)
                .expect(201, done);
        };
    };

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent 0 (1, 2, 3)', signDocumentsFn(0, 0, [1, 2, 3]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it('user 1 signs consent 1 (5, 10, 11)', signDocumentsFn(1, 1, [5, 10, 11]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it('user 2 signs consent 3 (8, 9, 10)', signDocumentsFn(2, 3, [8, 9, 10]));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it('user 3 signs consent 0 (0, 2, 3, 4)', signDocumentsFn(3, 0, [0, 2, 3, 4]));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it(`get/verify user 0 consent 0 documents`, getUserConsentDocumentsFn(0, 0, [1, 2, 3]));
    it(`get/verify user 0 consent 0 documents by name`, getUserConsentDocumentsByNameFn(0, 0, [1, 2, 3]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it(`get/verify user 1 consent 1 documents`, getUserConsentDocumentsFn(1, 1, [5, 10, 11]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it(`get/verify user 2 consent 3 documents`, getUserConsentDocumentsFn(2, 3, [8, 9, 10]));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it(`get/verify user 3 consent 0 documents`, getUserConsentDocumentsFn(3, 0, [0, 2, 3, 4]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    [2, 10, 8, 4].forEach(typeIndex => {
        it(`create/verify consent document of type ${typeIndex}`, shared.createConsentDocumentFn(store, history, typeIndex));
    });
    it('logout as super', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it(`get/verify user 0 consent 0 documents`, getUserConsentDocumentsFn(0, 0, [1, 3]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it(`get/verify user 1 consent 1 documents`, getUserConsentDocumentsFn(1, 1, [5, 11]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it(`get/verify user 2 consent 3 documents`, getUserConsentDocumentsFn(2, 3, [9]));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it(`get/verify user 3 consent 0 documents`, getUserConsentDocumentsFn(3, 0, [0, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent 0 (0, 2)', signDocumentsFn(0, 0, [0, 2]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it('user 1 signs consent 1 (8, 10)', signDocumentsFn(1, 1, [8, 10]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it('user 2 signs consent 3 (8, 11)', signDocumentsFn(2, 3, [8, 11]));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it('user 3 signs consent 0 (2, 4)', signDocumentsFn(3, 0, [2, 4]));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it(`get/verify user 0 consent 0 documents`, getUserConsentDocumentsFn(0, 0, [0, 1, 2, 3]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it(`get/verify user 1 consent 1 documents`, getUserConsentDocumentsFn(1, 1, [5, 8, 10, 11]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it(`get/verify user 2 consent 3 documents`, getUserConsentDocumentsFn(2, 3, [8, 9, 11]));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it(`get/verify user 3 consent 0 documents`, getUserConsentDocumentsFn(3, 0, [0, 2, 3, 4]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    [2, 10].forEach(typeIndex => {
        it(`create/verify consent document of type ${typeIndex}`, shared.createConsentDocumentFn(store, history, typeIndex));
    });
    it('logout as super', shared.logoutFn(store));

    it('update history for type 2', function (done) {
        const typeId = history.typeId(2);
        store.server
            .get(`/api/v1.0/consent-documents/update-comments/${typeId}`)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const servers = history.serversHistory().filter(h => (h.typeId === typeId));
                const comments = _.map(servers, 'updateComment');
                expect(res.body).to.deep.equal(comments);
                done();
            });
    });
});
