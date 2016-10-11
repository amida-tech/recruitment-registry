/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const SharedIntegration = require('./util/shared-integration');
const Generator = require('./util/entity-generator');
const ConsentSectionHistory = require('./util/consent-section-history');
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
    const history = new ConsentSectionHistory(userCount);

    before(shared.setUpFn(store));

    const createConsentSectionTypeFn = function () {
        const cst = generator.newConsentSectionType();
        return function (done) {
            store.server
                .post('/api/v1.0/consent-section-types')
                .set('Authorization', store.auth)
                .send(cst)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.pushType(cst, res.body);
                    done();
                });
        };
    };

    const listConsentSectionTypesFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/consent-section-types')
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
        it(`create consent section type ${i}`, createConsentSectionTypeFn());
        it('get/verify consent section types', listConsentSectionTypesFn());
    }

    for (let i = 0; i < userCount; ++i) {
        const user = generator.newUser();
        it(`create user ${i}`, shared.createUserFn(store, history.hxUser, user));
    }

    it('logout as super', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, history.hxUser, 0));
    it('error: no consent sections of existing types', function (done) {
        store.server
            .get(`/api/v1.0/users/consent-sections`)
            .set('Authorization', store.auth)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.equal(RRError.message('noSystemConsentSections'));
                done();
            });
    });
    it('logout as user 0', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    const createConsentSectionFn = function (typeIndex) {
        return function (done) {
            const typeId = history.typeId(typeIndex);
            const cs = generator.newConsentSection({ typeId });
            store.server
                .post(`/api/v1.0/consent-sections`)
                .set('Authorization', store.auth)
                .send(cs)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.push(typeIndex, cs, res.body);
                    done();
                });
        };
    };

    const getConsentSectionFn = function (typeIndex) {
        return function (done) {
            const id = history.id(typeIndex);
            store.server
                .get(`/api/v1.0/consent-sections/${id}`)
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
        it(`create consent section of type ${i}`, createConsentSectionFn(i));
        it(`get/verify consent section content of type ${i}`, getConsentSectionFn(i));
    }

    const getUserConsentSectionsFn = function (expectedIndices) {
        return function (done) {
            store.server
                .get('/api/v1.0/users/consent-sections')
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
        it(`verify consent sections required for user ${i}`, getUserConsentSectionsFn([0, 1]));
        it(`user ${i} get consent section 0`, getConsentSectionFn(0));
        it(`user ${i} get consent section 1`, getConsentSectionFn(1));
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    const signConsentSectionTypeFn = function (typeIndex) {
        return function (done) {
            const consentSectionId = history.id(typeIndex);
            store.server
                .post(`/api/v1.0/consent-section-signatures`)
                .set('Authorization', store.auth)
                .send({ consentSectionId })
                .expect(201, done);
        };
    };

    const signConsentSectionTypeAgainFn = function (typeIndex) {
        return function (done) {
            const consentSectionId = history.id(typeIndex);
            store.server
                .post(`/api/v1.0/consent-section-signatures`)
                .set('Authorization', store.auth)
                .send({ consentSectionId })
                .expect(400, done);
        };
    };

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent section 0', signConsentSectionTypeFn(0));
    it('user 0 signs consent section 1', signConsentSectionTypeFn(1));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent section again 0', signConsentSectionTypeAgainFn(0));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it('user 1 signs consent section 0', signConsentSectionTypeFn(0));
    it('user 1 signs consent section 1', signConsentSectionTypeFn(1));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it('user 2 signs consent section 1', signConsentSectionTypeFn(0));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it('user 3 signs consent section 0', signConsentSectionTypeFn(1));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it(`verify consent sections required for user 0`, getUserConsentSectionsFn([]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it(`verify consent sections required for user 1`, getUserConsentSectionsFn([]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it(`verify consent sections required for user 2`, getUserConsentSectionsFn([1]));
    it(`user 2 get consent section 1`, getConsentSectionFn(1));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it(`verify consent sections required for user 3`, getUserConsentSectionsFn([0]));
    it(`user 3 get consent section 0`, getConsentSectionFn(0));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it('add a new consent section type', createConsentSectionTypeFn());
    it('create/verify consent section of type 2', createConsentSectionFn(2));
    it('logout as super', shared.logoutFn(store));

    const signConsentSectionType = ((userIndex, consentSectionIndex) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(store, history.hxUser, userIndex));
        it(`user ${userIndex} signs consent section ${consentSectionIndex}`, signConsentSectionTypeFn(consentSectionIndex));
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    const verifyConsentSections = ((userIndex, consentSectionIndices) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(store, history.hxUser, userIndex));
        it(`verify consent sections required for user ${userIndex}`, getUserConsentSectionsFn(consentSectionIndices));
        for (let i = 0; i < consentSectionIndices.length; ++i) {
            it(`user ${userIndex} get consent section ${i}`, getConsentSectionFn(i));
        }
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    verifyConsentSections(0, [2]);
    verifyConsentSections(1, [2]);
    verifyConsentSections(2, [1, 2]);
    verifyConsentSections(3, [0, 2]);

    signConsentSectionType(2, 2);

    verifyConsentSections(2, [1]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify consent section of type 1', createConsentSectionFn(1));
    it('logout as super', shared.logoutFn(store));

    verifyConsentSections(0, [1, 2]);
    verifyConsentSections(1, [1, 2]);
    verifyConsentSections(2, [1]);
    verifyConsentSections(3, [0, 1, 2]);

    signConsentSectionType(1, 2);
    verifyConsentSections(1, [1]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify consent section of type 0', createConsentSectionFn(0));
    it('logout as super', shared.logoutFn(store));

    verifyConsentSections(0, [0, 1, 2]);
    verifyConsentSections(1, [0, 1]);
    verifyConsentSections(2, [0, 1]);
    verifyConsentSections(3, [0, 1, 2]);

    signConsentSectionType(2, 1);
    signConsentSectionType(3, 1);

    verifyConsentSections(0, [0, 1, 2]);
    verifyConsentSections(1, [0, 1]);
    verifyConsentSections(2, [0]);
    verifyConsentSections(3, [0, 2]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify consent section of type 1', createConsentSectionFn(1));
    it('logout as super', shared.logoutFn(store));

    verifyConsentSections(0, [0, 1, 2]);
    verifyConsentSections(1, [0, 1]);
    verifyConsentSections(2, [0, 1]);
    verifyConsentSections(3, [0, 1, 2]);

    signConsentSectionType(0, 1);
    verifyConsentSections(0, [0, 2]);
    signConsentSectionType(0, 2);
    verifyConsentSections(0, [0]);
    signConsentSectionType(0, 0);
    verifyConsentSections(0, []);

    const deleteConsentSectionTypeFn = function (index) {
        return function (done) {
            const id = history.typeId(index);
            store.server
                .delete(`/api/v1.0/consent-section-types/${id}`)
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
    it('delete consent section type 1', deleteConsentSectionTypeFn(1));
    it('get/verify consent section types', listConsentSectionTypesFn());
    it('logout as super', shared.logoutFn(store));

    verifyConsentSections(0, []);
    verifyConsentSections(1, [0]);
    verifyConsentSections(2, [0]);
    verifyConsentSections(3, [0, 1]);
});
