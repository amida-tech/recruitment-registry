'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const comparator = require('./comparator');
const errSpec = require('./err-handler-spec');

const expect = chai.expect;

const verifySignatureIpAndUserAgent = function (typeIdCount) {
    const query = 'select consent_type.id as "typeId", ip, user_agent as "userAgent" from consent_signature, consent_type, consent_document where consent_signature.consent_document_id = consent_document.id and consent_type.id = consent_document.type_id';
    return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
        .then((result) => {
            const typeGroups = _.groupBy(result, 'typeId');
            const typeIds = Object.keys(typeGroups);
            expect(typeIds).to.have.length(typeIdCount);
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
};

const BaseTests = class BaseTests {
    constructor({ generator, hxConsentDocument }) {
        this.generator = generator;
        this.hxConsentDocument = hxConsentDocument;
    }

    listUserConsentDocumentsFn(userIndex, expectedIndices) {
        const self = this;
        return function listUserConsentDocuments() {
            const hx = self.hxConsentDocument;
            const user = hx.user(userIndex);
            return self.listUserConsentDocumentsPx(user)
                .then((consentDocuments) => {
                    const expected = hx.serversInList(expectedIndices);
                    comparator.consentDocuments(expected, consentDocuments);
                    return expected;
                });
        };
    }

    listTranslatedUserConsentDocumentsFn(userIndex, expectedIndices, language) {
        const self = this;
        return function listTranslatedUserConsentDocuments() {
            const hx = self.hxConsentDocument;
            const user = hx.user(userIndex);
            return self.listOptionedUserConsentDocumentsPx(user, { language })
                .then((consentDocuments) => {
                    const options = Object.assign({ role: user.role }, { language });
                    const expected = hx.translatedServersInList(expectedIndices, options);
                    comparator.consentDocuments(expected, consentDocuments);
                    return expected;
                });
        };
    }

    listSignedUserConsentDocumentsFn(userIndex, options) {
        const self = this;
        return function listUserConsentDocuments() {
            const hx = self.hxConsentDocument;
            const user = hx.user(userIndex);
            return self.listOptionedUserConsentDocumentsPx(user, options)
                .then((consentDocuments) => {
                    Object.assign(options, { role: user.role });
                    const expected = hx.serversInListWithSigned(userIndex, options);
                    comparator.consentDocuments(expected, consentDocuments);
                    return expected;
                });
        };
    }

    verifySignatureExistenceFn(userIndex) {
        const self = this;
        return function verifySignatureExistence() {
            const hx = self.hxConsentDocument;
            const userId = hx.userId(userIndex);
            return self.verifySignatureExistencePx(userId)
                .then((result) => {
                    const expected = _.sortBy(hx.signatures[userIndex], 'id');
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    getConsentDocumentFn(userIndex, typeIndex) {
        const self = this;
        return function getConsentDocument() {
            const hx = self.hxConsentDocument;
            const userId = hx.userId(userIndex);
            const id = hx.id(typeIndex);
            return self.getConsentDocumentPx(userId, id)
                .then((result) => {
                    const expected = hx.serverWithSignatureInfo(userIndex, typeIndex);
                    expect(result).to.deep.equal(expected);
                });
        };
    }
};

const SpecTests = class ConsentTypeSpecTests extends BaseTests {
    constructor(params) {
        super(params);
        this.models = models;
    }

    listUserConsentDocumentsPx(user) {
        const { id: userId, role } = user;
        return this.models.userConsentDocument.listUserConsentDocuments(userId, { role });
    }

    listOptionedUserConsentDocumentsPx(user, options) {
        const { id: userId, role } = user;
        const daoOptions = Object.assign({ role }, options);
        return this.models.userConsentDocument.listUserConsentDocuments(userId, daoOptions);
    }

    signConsentTypeFn(userIndex, typeIndex, language) {
        const self = this;
        return function signConsentType() {
            const hx = self.hxConsentDocument;
            const consentDocumentId = hx.id(typeIndex);
            const userId = hx.userId(userIndex);
            hx.sign(typeIndex, userIndex, language);
            const payload = { userId, consentDocumentId };
            if (language) {
                payload.language = language;
            }
            return self.models.consentSignature.createSignature(payload);
        };
    }

    verifySignatureExistencePx(userId) {
        return this.models.consentSignature.getSignatureHistory(userId);
    }

    errorSignConsentTypeFn(userIndex, typeIndex) {
        const self = this;
        return function signConsentType() {
            const hx = self.hxConsentDocument;
            const payload = { userId: 999999, consentDocumentId: 999999 };
            if (userIndex !== null) {
                payload.userId = hx.userId(userIndex);
            }
            if (typeIndex !== null) {
                payload.consentDocumentId = hx.id(typeIndex);
            }
            const errKey = 'SequelizeForeignKeyConstraintError';
            return self.models.consentSignature.createSignature(payload)
                .then(errSpec.throwingHandler, errSpec.expectedSeqErrorHandlerFn(errKey));
        };
    }

    errorListUserConsentDocumentsFn(userIndex, errKey) {
        const self = this;
        return function errorListUserConsentDocuments() {
            const hx = self.hxConsentDocument;
            const userId = hx.userId(userIndex);
            const errFn = errSpec.expectedErrorHandlerFn(errKey);
            return self.models.userConsentDocument.listUserConsentDocuments(userId)
                .then(errSpec.throwingHandler, errFn);
        };
    }

    getConsentDocumentPx(userId, id) {
        return this.models.userConsentDocument.getUserConsentDocument(userId, id);
    }
};

const IntegrationTests = class ConsentTypeIntegrationTests extends BaseTests {
    constructor(rrSuperTest, params) {
        super(params);
        this.rrSuperTest = rrSuperTest;
    }

    listUserConsentDocumentsPx() {
        return this.rrSuperTest.get('/user-consent-documents', true, 200)
            .then(res => res.body);
    }

    listOptionedUserConsentDocumentsPx(user, options) {
        const queryParams = {};
        if (options.language) {
            queryParams.language = options.language;
        }
        if (options.includeSigned) {
            queryParams['include-signed'] = true;
        }
        if (options.roleOnly) {
            queryParams['role-only'] = true;
        }
        return this.rrSuperTest.get('/user-consent-documents', true, 200, queryParams)
            .then(res => res.body);
    }

    errorListUserConsentDocumentsFn(userIndex, errKey) {
        const self = this;
        return function errorListUserConsentDocuments() {
            return self.rrSuperTest.get('/user-consent-documents', true, 400)
                .then(res => errSpec.verifyErrorMessage(res, errKey));
        };
    }

    signConsentTypeFn(userIndex, typeIndex, language) {
        const self = this;
        return function signConsentType() {
            const hx = self.hxConsentDocument;
            const consentDocumentId = hx.id(typeIndex);
            const input = { consentDocumentId };
            const typeId = hx.typeId(typeIndex);
            if (language) {
                input.language = language;
            }
            const header = {
                'User-Agent': `Browser-${typeId}`,
                'X-Forwarded-For': [`9848.3${typeId}.838`, `111.${typeId}0.999`],
            };
            hx.sign(typeIndex, userIndex, language);
            return self.rrSuperTest.post('/consent-signatures', input, 201, header);
        };
    }

    verifySignatureExistencePx(userId) {
        return this.rrSuperTest.get('/consent-signatures', true, 200, { 'user-id': userId })
            .then(res => res.body);
    }

    errorSignConsentTypeFn(userIndex, typeIndex) {
        const self = this;
        return function errorSignConsentType() {
            const hx = self.hxConsentDocument;
            const consentDocumentId = hx.id(typeIndex);
            return self.rrSuperTest.post('/consent-signatures', { consentDocumentId }, 400);
        };
    }

    getConsentDocumentPx(userId, id) {
        return this.rrSuperTest.get(`/user-consent-documents/${id}`, true, 200)
            .then(res => res.body);
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
    verifySignatureIpAndUserAgent,
};
