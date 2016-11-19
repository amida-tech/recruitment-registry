/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/entity-generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const config = require('../config');
const RRError = require('../lib/rr-error');
const models = require('../models');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('consent document integration', function () {
    const userCount = 4;

    const store = new RRSuperTest();
    const history = new ConsentDocumentHistory(userCount);

    before(shared.setUpFn(store));

    const listConsentTypesFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/consent-types')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .expect(function (res) {
                    const types = history.listTypes();
                    expect(res.body).to.deep.equal(types);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 2; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(store, history));
        it('verify consent type list', listConsentTypesFn());
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(store, i, 'es', history.hxType));
    }

    for (let i = 0; i < userCount; ++i) {
        const user = generator.newUser();
        it(`create user ${i}`, shared.createUserFn(store, history.hxUser, user));
    }

    it('logout as super', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, history.hxUser, 0));
    it('error: no consent documents of existing types', function (done) {
        store.server
            .get(`/api/v1.0/user-consent-documents`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(400)
            .expect(function (res) {
                expect(res.body.message).to.equal(RRError.message('noSystemConsentDocuments'));
            })
            .end(done);
    });
    it('logout as user 0', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    const getConsentDocumentFn = function (typeIndex) {
        return function (done) {
            const id = history.id(typeIndex);
            store.server
                .get(`/api/v1.0/consent-documents/${id}`)
                .expect(200)
                .expect(function (res) {
                    const expected = history.server(typeIndex);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const getConsentDocumentByTypeNameFn = function (typeIndex) {
        return function (done) {
            const typeName = history.type(typeIndex).name;
            store.server
                .get(`/api/v1.0/consent-documents/type-name/${typeName}`)
                .expect(200)
                .expect(function (res) {
                    const expected = history.server(typeIndex);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const getTranslatedConsentDocumentFn = function (typeIndex, language) {
        return function (done) {
            const id = history.id(typeIndex);
            store.server
                .get(`/api/v1.0/consent-documents/${id}`)
                .query({ language })
                .expect(200)
                .expect(function (res) {
                    const expected = history.hxDocument.translatedServer(typeIndex, language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(store, history, i));
        it(`get/verify consent document content of type ${i}`, getConsentDocumentFn(i));
        it(`get/verify consent document content of type ${i} (type name)`, getConsentDocumentByTypeNameFn(i));
        it(`add translated (es) consent document ${i}`, shared.translateConsentDocumentFn(store, i, 'es', history));
        it(`verify translated (es) consent document of type ${i}`, getTranslatedConsentDocumentFn(i, 'es'));
    }

    const getUserConsentDocumentsFn = function (expectedIndices) {
        return function (done) {
            store.server
                .get('/api/v1.0/user-consent-documents')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .expect(function (res) {
                    const expected = history.serversInList(expectedIndices);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const getTranslatedUserConsentDocumentsFn = function (expectedIndices, language) {
        return function (done) {
            store.server
                .get('/api/v1.0/user-consent-documents')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ language })
                .expect(200)
                .expect(function (res) {
                    const expected = history.translatedServersInList(expectedIndices, language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`login as user ${i}`, shared.loginIndexFn(store, history.hxUser, i));
        it(`verify consent documents required for user ${i}`, getUserConsentDocumentsFn([0, 1]));
        it(`verify translated consent documents required for user ${i}`, getTranslatedUserConsentDocumentsFn([0, 1], 'es'));
        it(`user ${i} get consent document of type 0`, getConsentDocumentFn(0));
        it(`user ${i} get consent document of type 1`, getConsentDocumentFn(1));
        it(`user ${i} get translated (es) consent document of type 0`, getTranslatedConsentDocumentFn(0, 'es'));
        it(`user ${i} get translated (es) consent document of type 1`, getTranslatedConsentDocumentFn(1, 'es'));
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    const signConsentTypeFn = function (userIndex, typeIndex, language) {
        return function (done) {
            const consentDocumentId = history.id(typeIndex);
            const input = { consentDocumentId };
            const typeId = history.typeId(typeIndex);
            if (language) {
                input.language = language;
            }
            store.server
                .post(`/api/v1.0/consent-signatures`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .set('User-Agent', `Browser-${typeId}`)
                .set('X-Forwarded-For', [`9848.3${typeId}.838`, `111.${typeId}0.999`])
                .send(input)
                .expect(201)
                .expect(function () {
                    history.sign(typeIndex, userIndex, language);
                })
                .end(done);
        };
    };

    const signConsentTypeAgainFn = function (typeIndex) {
        return function (done) {
            const consentDocumentId = history.id(typeIndex);
            store.server
                .post(`/api/v1.0/consent-signatures`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send({ consentDocumentId })
                .expect(400, done);
        };
    };

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent document of type 0', signConsentTypeFn(0, 0));
    it('user 0 signs consent document of type 1', signConsentTypeFn(0, 1));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it('user 0 signs consent document of type again 0', signConsentTypeAgainFn(0));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it('user 1 signs consent document of type 0', signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document of type 1', signConsentTypeFn(1, 1, 'sp'));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it('user 2 signs consent document of type 1', signConsentTypeFn(2, 0));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it('user 3 signs consent document of type 0', signConsentTypeFn(3, 1));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginIndexFn(store, history.hxUser, 0));
    it(`verify consent documents required for user 0`, getUserConsentDocumentsFn([]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginIndexFn(store, history.hxUser, 1));
    it(`verify consent documents required for user 1`, getUserConsentDocumentsFn([]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginIndexFn(store, history.hxUser, 2));
    it(`verify consent documents required for user 2`, getUserConsentDocumentsFn([1]));
    it(`user 2 get consent document of 1`, getConsentDocumentFn(1));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginIndexFn(store, history.hxUser, 3));
    it(`verify consent documents required for user 3`, getUserConsentDocumentsFn([0]));
    it(`user 3 get consent document of 0`, getConsentDocumentFn(0));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it('add a new consent type', shared.createConsentTypeFn(store, history));
    it('create/verify consent document of type 2', shared.createConsentDocumentFn(store, history, 2));
    it('logout as super', shared.logoutFn(store));

    const signConsentType = ((userIndex, consentDocumentIndex, language) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(store, history.hxUser, userIndex));
        it(`user ${userIndex} signs consent document of type ${consentDocumentIndex}`, signConsentTypeFn(userIndex, consentDocumentIndex, language));
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    const verifyConsentDocuments = ((userIndex, consentDocumentIndices) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(store, history.hxUser, userIndex));
        it(`verify consent documents required for user ${userIndex}`, getUserConsentDocumentsFn(consentDocumentIndices));
        for (let i = 0; i < consentDocumentIndices.length; ++i) {
            it(`user ${userIndex} get consent document of ${i}`, getConsentDocumentFn(consentDocumentIndices[i]));
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
    it('create consent document of type 1', shared.createConsentDocumentFn(store, history, 1));
    it('logout as super', shared.logoutFn(store));

    verifyConsentDocuments(0, [1, 2]);
    verifyConsentDocuments(1, [1, 2]);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(1, 2, 'sp');
    verifyConsentDocuments(1, [1]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create consent document of type 0', shared.createConsentDocumentFn(store, history, 0));
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
    it('create consent document of type 1', shared.createConsentDocumentFn(store, history, 1));
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
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(204)
                .expect(function () {
                    history.deleteType(index);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    it('delete consent type 1', deleteConsentTypeFn(1));
    it('verify consent list', listConsentTypesFn());
    it('logout as super', shared.logoutFn(store));

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [0]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    const verifySignaturesFn = function (userIndex) {
        return function (done) {
            const userId = history.userId(userIndex);
            store.server
                .get(`/api/v1.0/consent-signatures`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ 'user-id': userId })
                .expect(200)
                .expect(function (res) {
                    const expected = _.sortBy(history.signatures[userIndex], 'id');
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 0; i < userCount; ++i) {
        it('verify signatures', verifySignaturesFn(i));
    }
    it('logout as super', shared.logoutFn(store));

    it('check ip and browser (user-agent) of signature', function () {
        const query = 'select consent_type.id as "typeId", ip, user_agent as "userAgent" from consent_signature, consent_type, consent_document where consent_signature.consent_document_id = consent_document.id and consent_type.id = consent_document.type_id';
        return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
            .then(result => {
                const typeGroups = _.groupBy(result, 'typeId');
                const typeIds = Object.keys(typeGroups);
                expect(typeIds).to.have.length(3);
                typeIds.forEach(typeId => {
                    const expectedUserAgent = `Browser-${typeId}`;
                    const expectedIp = `9848.3${typeId}.838`;
                    const records = typeGroups[typeId];
                    records.forEach(({ ip, userAgent }) => {
                        expect(ip).to.equal(expectedIp);
                        expect(userAgent).to.equal(expectedUserAgent);
                    });
                });

            });
    });
});
