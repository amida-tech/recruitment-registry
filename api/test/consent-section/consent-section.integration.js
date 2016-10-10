/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('../util/shared-integration');
const Generator = require('../util/entity-generator');
const config = require('../../config');
const RRError = require('../../lib/rr-error');

const expect = chai.expect;
const entityGen = new Generator();
const shared = new SharedIntegration();

describe('consent section integration', function () {
    const userCount = 4;

    const store = {
        users: [],
        consentSectionTypes: [],
        clientConsentSections: [],
        consentSections: [],
        activeConsentSections: [],
        signatures: _.range(userCount).map(() => [])
    };

    before(shared.setUpFn(store));

    const createConsentSectionTypeFn = function () {
        const cst = entityGen.newConsentSectionType();
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
                    const id = res.body.id;
                    const newDocType = Object.assign({}, cst, { id });
                    store.consentSectionTypes.push(newDocType);
                    store.activeConsentSections.push(null);
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
                    expect(res.body).to.deep.equal(store.consentSectionTypes);
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
        it(`create user ${i}`, shared.createUserFn(store, entityGen.newUser()));
    }

    it('logout as super', shared.logoutFn(store));

    it('login as user 0', shared.loginFn(store, 0));
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

    const createConsentSectionFn = (function () {
        let index = -1;

        return function (typeIndex) {
            return function (done) {
                ++index;
                const typeId = store.consentSectionTypes[typeIndex].id;
                const content = `Sample consent section content ${index}`;
                store.clientConsentSections.push(content);
                store.server
                    .post(`/api/v1.0/consent-sections/type/${typeId}`)
                    .set('Authorization', store.auth)
                    .send({ content })
                    .expect(201)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }
                        const id = res.body.id;
                        const docToStore = { id, typeId, content };
                        store.consentSections.push(docToStore);
                        store.activeConsentSections[typeIndex] = docToStore;
                        done();
                    });
            };
        };
    })();

    const getConsentSectionFn = function (typeIndex) {
        return function (done) {
            const id = store.activeConsentSections[typeIndex].id;
            store.server
                .get(`/api/v1.0/consent-sections/${id}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = store.activeConsentSections[typeIndex].content;
                    expect(res.body.content).to.equal(expected);
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
                    const rawExpected = expectedIndices.map(index => ({
                        id: store.activeConsentSections[index].id,
                        name: store.consentSectionTypes[index].name,
                        title: store.consentSectionTypes[index].title
                    }));
                    const expected = _.sortBy(rawExpected, 'id');
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    const getContentFn = function (expectedIndex) {
        return function (done) {
            const doc = store.activeConsentSections[expectedIndex];
            store.server
                .get(`/api/v1.0/consent-sections/${doc.id}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.deep.equal({ content: doc.content });
                    done();
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`login as user ${i}`, shared.loginFn(store, store.users[i]));
        it(`verify consent sections required for user ${i}`, getUserConsentSectionsFn([0, 1]));
        it(`user ${i} get consent section 0`, getContentFn(0));
        it(`user ${i} get consent section 1`, getContentFn(1));
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    const signConsentSectionTypeFn = function (typeIndex) {
        return function (done) {
            const consentSectionId = store.activeConsentSections[typeIndex].id;
            store.server
                .post(`/api/v1.0/consent-section-signatures`)
                .set('Authorization', store.auth)
                .send({ consentSectionId })
                .expect(201, done);
        };
    };

    const signConsentSectionTypeAgainFn = function (typeIndex) {
        return function (done) {
            const consentSectionId = store.activeConsentSections[typeIndex].id;
            store.server
                .post(`/api/v1.0/consent-section-signatures`)
                .set('Authorization', store.auth)
                .send({ consentSectionId })
                .expect(400, done);
        };
    };

    it(`login as user 0`, shared.loginFn(store, 0));
    it('user 0 signs consent section 0', signConsentSectionTypeFn(0));
    it('user 0 signs consent section 1', signConsentSectionTypeFn(1));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 0`, shared.loginFn(store, 0));
    it('user 0 signs consent section again 0', signConsentSectionTypeAgainFn(0));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginFn(store, 1));
    it('user 1 signs consent section 0', signConsentSectionTypeFn(0));
    it('user 1 signs consent section 1', signConsentSectionTypeFn(1));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginFn(store, 2));
    it('user 2 signs consent section 1', signConsentSectionTypeFn(0));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginFn(store, 3));
    it('user 3 signs consent section 0', signConsentSectionTypeFn(1));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginFn(store, 0));
    it(`verify consent sections required for user 0`, getUserConsentSectionsFn([]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginFn(store, 1));
    it(`verify consent sections required for user 1`, getUserConsentSectionsFn([]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginFn(store, 2));
    it(`verify consent sections required for user 2`, getUserConsentSectionsFn([1]));
    it(`user 2 get consent section 1`, getContentFn(1));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginFn(store, 3));
    it(`verify consent sections required for user 3`, getUserConsentSectionsFn([0]));
    it(`user 3 get consent section 0`, getContentFn(0));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it('add a new consent section type', createConsentSectionTypeFn());
    it('create/verify consent section of type 2', createConsentSectionFn(2));
    it('logout as super', shared.logoutFn(store));

    const signConsentSectionType = ((userIndex, consentSectionIndex) => {
        it(`login as user ${userIndex}`, shared.loginFn(store, userIndex));
        it(`user ${userIndex} signs consent section ${consentSectionIndex}`, signConsentSectionTypeFn(consentSectionIndex));
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    const verifyConsentSections = ((userIndex, consentSectionIndices) => {
        it(`login as user ${userIndex}`, shared.loginFn(store, userIndex));
        it(`verify consent sections required for user ${userIndex}`, getUserConsentSectionsFn(consentSectionIndices));
        for (let i = 0; i < consentSectionIndices.length; ++i) {
            it(`user ${userIndex} get consent section ${i}`, getContentFn(i));
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
            const id = store.consentSectionTypes[index].id;
            store.server
                .delete(`/api/v1.0/consent-section-types/${id}`)
                .set('Authorization', store.auth)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    store.consentSectionTypes.splice(index, 1);
                    store.activeConsentSections.splice(index, 1);
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
