/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const config = require('../config');
const models = require('../models');
const comparator = require('./util/comparator');

const expect = chai.expect;

describe('consent document integration', () => {
    const userCount = 4;

    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const history = new ConsentDocumentHistory(userCount);

    before(shared.setUpFn());

    const listConsentTypesFn = function () {
        return function listConsentTypes(done) {
            rrSuperTest.get('/consent-types', true, 200)
                .expect((res) => {
                    const types = history.listTypes();
                    expect(res.body).to.deep.equal(types);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(config.superUser));

    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, shared.createConsentTypeFn(history));
        it('verify consent type list', listConsentTypesFn());
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(i, 'es', history.hxType));
    });

    _.range(userCount).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(history.hxUser));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('error: no consent documents of existing types', (done) => {
        rrSuperTest.get('/user-consent-documents', true, 400)
            .expect(res => shared.verifyErrorMessage(res, 'noSystemConsentDocuments'))
            .end(done);
    });
    it('logout as user 0', shared.logoutFn());

    const getConsentDocumentFn = function (typeIndex) {
        return function getConsentDocument(done) {
            const id = history.id(typeIndex);
            rrSuperTest.get(`/consent-documents/${id}`, false, 200)
                .expect((res) => {
                    const expected = history.server(typeIndex);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const getConsentDocumentByTypeIdFn = function (typeIndex) {
        return function getConsentDocumentByTypeId(done) {
            const typeId = history.type(typeIndex).id;
            rrSuperTest.get(`/consent-documents/type/${typeId}`, false, 200)
                .expect((res) => {
                    const expected = history.server(typeIndex);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const getTranslatedConsentDocumentFn = function (typeIndex, language) {
        return function getTranslatedConsentDocument(done) {
            const id = history.id(typeIndex);
            rrSuperTest.get(`/consent-documents/${id}`, false, 200, { language })
                .expect((res) => {
                    const expected = history.hxDocument.translatedServer(typeIndex, language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    _.range(2).forEach((i) => {
        it('login as super', shared.loginFn(config.superUser));
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(history, i));
        it('logout as super', shared.logoutFn());
        it(`get/verify consent document content of type ${i}`, getConsentDocumentFn(i));
        it(`get/verify consent document content of type ${i} (type id)`, getConsentDocumentByTypeIdFn(i));
        it('login as super', shared.loginFn(config.superUser));
        it(`add translated (es) consent document ${i}`, shared.translateConsentDocumentFn(i, 'es', history));
        it('logout as super', shared.logoutFn());
        it(`verify translated (es) consent document of type ${i}`, getTranslatedConsentDocumentFn(i, 'es'));
    });

    const getUserConsentDocumentsFn = function (expectedIndices) {
        return function getUserConsentDocuments(done) {
            rrSuperTest.get('/user-consent-documents', true, 200)
                .expect((res) => {
                    const expected = history.serversInList(expectedIndices);
                    comparator.consentDocuments(expected, res.body);
                })
                .end(done);
        };
    };

    const getUserConsentDocumentsAllFn = function (userIndex) {
        return function getUserConsentDocumentsAll(done) {
            rrSuperTest.get('/user-consent-documents', true, 200, { 'include-signed': true })
                .expect((res) => {
                    const expected = history.serversInListWithSigned(userIndex);
                    comparator.consentDocuments(expected, res.body);
                })
                .end(done);
        };
    };

    const getTranslatedUserConsentDocumentsFn = function (expectedIndices, language) {
        return function getTranslatedUserConsentDocuments(done) {
            rrSuperTest.get('/user-consent-documents', true, 200, { language })
                .expect((res) => {
                    const expected = history.translatedServersInList(expectedIndices, language);
                    comparator.consentDocuments(expected, res.body);
                })
                .end(done);
        };
    };

    it('logout as super', shared.logoutFn());

    _.range(4).forEach((i) => {
        it(`login as user ${i}`, shared.loginIndexFn(history.hxUser, i));
        it(`verify consent documents required for user ${i}`, getUserConsentDocumentsFn([0, 1]));
        it(`verify translated consent documents required for user ${i}`, getTranslatedUserConsentDocumentsFn([0, 1], 'es'));
        it(`logout as user ${i}`, shared.logoutFn());
        it(`user ${i} get consent document of type 0`, getConsentDocumentFn(0));
        it(`user ${i} get consent document of type 1`, getConsentDocumentFn(1));
        it(`user ${i} get translated (es) consent document of type 0`, getTranslatedConsentDocumentFn(0, 'es'));
        it(`user ${i} get translated (es) consent document of type 1`, getTranslatedConsentDocumentFn(1, 'es'));
    });

    const signConsentTypeFn = function (userIndex, typeIndex, language) {
        return function signConsentType(done) {
            const consentDocumentId = history.id(typeIndex);
            const input = { consentDocumentId };
            const typeId = history.typeId(typeIndex);
            if (language) {
                input.language = language;
            }
            const header = {
                'User-Agent': `Browser-${typeId}`,
                'X-Forwarded-For': [`9848.3${typeId}.838`, `111.${typeId}0.999`],
            };
            rrSuperTest.post('/consent-signatures', input, 201, header)
                .expect(() => {
                    history.sign(typeIndex, userIndex, language);
                })
                .end(done);
        };
    };

    const signConsentTypeAgainFn = function (typeIndex) {
        return function signConsentTypeAgain(done) {
            const consentDocumentId = history.id(typeIndex);
            rrSuperTest.post('/consent-signatures', { consentDocumentId }, 400).end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('user 0 signs consent document of type 0', signConsentTypeFn(0, 0));
    it('user 0 signs consent document of type 1', signConsentTypeFn(0, 1));
    it('logout as user 0', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('user 0 signs consent document of type again 0', signConsentTypeAgainFn(0));
    it('logout as user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(history.hxUser, 1));
    it('user 1 signs consent document of type 0', signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document of type 1', signConsentTypeFn(1, 1, 'es'));
    it('logout as user 1', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(history.hxUser, 2));
    it('user 2 signs consent document of type 1', signConsentTypeFn(2, 0));
    it('logout as user 2', shared.logoutFn());

    it('login as user 3', shared.loginIndexFn(history.hxUser, 3));
    it('user 3 signs consent document of type 0', signConsentTypeFn(3, 1));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('verify consent documents required for user 0', getUserConsentDocumentsFn([]));
    it('logout as user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(history.hxUser, 1));
    it('verify consent documents required for user 1', getUserConsentDocumentsFn([]));
    it('logout as user 1', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(history.hxUser, 2));
    it('verify consent documents required for user 2', getUserConsentDocumentsFn([1]));
    it('logout as user 2', shared.logoutFn());
    it('user 2 get consent document of 1', getConsentDocumentFn(1));

    it('login as user 3', shared.loginIndexFn(history.hxUser, 3));
    it('verify consent documents required for user 3', getUserConsentDocumentsFn([0]));
    it('logout as user 3', shared.logoutFn());
    it('user 3 get consent document of 0', getConsentDocumentFn(0));

    it('login as super', shared.loginFn(config.superUser));
    it('add a new consent type', shared.createConsentTypeFn(history));
    it('create/verify consent document of type 2', shared.createConsentDocumentFn(history, 2));
    it('logout as super', shared.logoutFn());

    const signConsentType = ((userIndex, consentDocumentIndex, language) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(history.hxUser, userIndex));
        it(`user ${userIndex} signs consent document of type ${consentDocumentIndex}`, signConsentTypeFn(userIndex, consentDocumentIndex, language));
        it(`logout as user ${userIndex}`, shared.logoutFn());
    });

    const verifyConsentDocuments = ((userIndex, consentDocumentIndices) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(history.hxUser, userIndex));
        it(`verify consent documents list (required) for user ${userIndex}`, getUserConsentDocumentsFn(consentDocumentIndices));
        it(`verify consent documents list (all) for user ${userIndex}`, getUserConsentDocumentsAllFn(userIndex));
        it(`logout as user ${userIndex}`, shared.logoutFn());
        _.range(consentDocumentIndices.length).forEach((i) => {
            it(`user ${userIndex} get consent document of ${i}`, getConsentDocumentFn(consentDocumentIndices[i]));
        });
    });

    verifyConsentDocuments(0, [2]);
    verifyConsentDocuments(1, [2]);
    verifyConsentDocuments(2, [1, 2]);
    verifyConsentDocuments(3, [0, 2]);

    signConsentType(2, 2, 'en');

    verifyConsentDocuments(2, [1]);

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 1', shared.createConsentDocumentFn(history, 1));
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, [1, 2]);
    verifyConsentDocuments(1, [1, 2]);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(1, 2, 'es');
    verifyConsentDocuments(1, [1]);

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 0', shared.createConsentDocumentFn(history, 0));
    it('logout as super', shared.logoutFn());

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

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 1', shared.createConsentDocumentFn(history, 1));
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(0, 1, 'en');
    verifyConsentDocuments(0, [0, 2]);
    signConsentType(0, 2, 'es');
    verifyConsentDocuments(0, [0]);
    signConsentType(0, 0);
    verifyConsentDocuments(0, []);

    const deleteConsentTypeFn = function (index) {
        return function deleteConsentType(done) {
            const id = history.typeId(index);
            rrSuperTest.delete(`/consent-types/${id}`, 204)
                .expect(() => {
                    history.deleteType(index);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(config.superUser));
    it('delete consent type 1', deleteConsentTypeFn(1));
    it('verify consent list', listConsentTypesFn());
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [0]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    const verifySignaturesFn = function (userIndex) {
        return function verifySignatures(done) {
            const userId = history.userId(userIndex);
            rrSuperTest.get('/consent-signatures', true, 200, { 'user-id': userId })
                .expect((res) => {
                    const expected = _.sortBy(history.signatures[userIndex], 'id');
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(config.superUser));
    _.range(userCount).forEach((i) => {
        it('verify signatures', verifySignaturesFn(i));
    });
    it('logout as super', shared.logoutFn());

    it('check ip and browser (user-agent) of signature', () => {
        const query = 'select consent_type.id as "typeId", ip, user_agent as "userAgent" from consent_signature, consent_type, consent_document where consent_signature.consent_document_id = consent_document.id and consent_type.id = consent_document.type_id';
        return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
            .then((result) => {
                const typeGroups = _.groupBy(result, 'typeId');
                const typeIds = Object.keys(typeGroups);
                expect(typeIds).to.have.length(3);
                typeIds.forEach((typeId) => {
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

    shared.verifyUserAudit();
});
