'use strict';

/* eslint max-len: 0 */

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const translator = require('./translator');
const comparator = require('./comparator');
const errSpec = require('./err-handler-spec');

const expect = chai.expect;

const BaseTests = class BaseTests {
    constructor({ hxConsent, history, generator, consentSpecs }) {
        this.hxConsent = hxConsent;
        this.history = history;
        this.generator = generator;
        this.consentSpecs = consentSpecs;
    }

    formExpectedConsent(index, typeIndices, signatures, options = {}) {
        const serverConsent = this.hxConsent.server(index);
        const expectedSections = typeIndices.reduce((r, typeIndex) => {
            const consentDocument = _.cloneDeep(this.history.server(typeIndex));
            const typeDetail = this.history.type(typeIndex);
            const role = typeDetail.role;
            if (options.roleOnly && !role) {
                return r;
            }
            if (options.role && role && options.role !== role) {
                return r;
            }
            delete consentDocument.typeId;
            const section = Object.assign({}, typeDetail, consentDocument);
            if (signatures) {
                const sign = signatures[typeIndex];
                section.signature = Boolean(sign);
                if (sign) {
                    section.language = sign;
                }
            }
            r.push(section);
            return r;
        }, []);
        const result = _.omit(serverConsent, 'typeIds');
        result.sections = expectedSections;
        return result;
    }

    formTranslatedExpectedConsent(index, typeIndices, signatures, options) {
        const language = options.language;
        const serverConsent = this.hxConsent.server(index);
        const expectedSections = typeIndices.reduce((r, typeIndex) => {
            const consentDocument = _.cloneDeep(this.history.translatedServer(typeIndex, language));
            if (consentDocument === null) {
                return null;
            }
            const typeDetail = this.history.translatedType(typeIndex, language);
            delete consentDocument.typeId;
            const role = typeDetail.role;
            if (options.roleOnly && !role) {
                return r;
            }
            if (options.role && role && options.role !== role) {
                return r;
            }
            const section = Object.assign({}, typeDetail, consentDocument);
            if (signatures) {
                const sign = signatures[typeIndex];
                section.signature = Boolean(sign);
                if (sign) {
                    section.language = sign;
                }
            }
            r.push(section);
            return r;
        }, []);
        const result = _.omit(serverConsent, 'typeIds');
        result.sections = expectedSections;
        return result;
    }

    getSurveyConsentDocuments(documentInfo) {
        const documentIndices = documentInfo.map(info => (Array.isArray(info) ? info[1] : info));
        const consentIndices = documentInfo.map(info => (Array.isArray(info) ? info[0] : null));
        const result = this.history.serversInList(documentIndices);
        _.range(result.length).forEach((index) => {
            const consentIndex = consentIndices[index];
            if (consentIndex !== null) {
                const consent = this.hxConsent.server(consentIndex);
                result[index].consentId = consent.id;
                result[index].consentName = consent.name;
            }
        });
        return result;
    }

    listConsentsFn() {
        const self = this;
        return function listConsents() {
            return self.listConsentsPx()
                .then((consents) => {
                    const expected = self.hxConsent.listServers();
                    expect(consents).to.deep.equal(expected);
                });
        };
    }

    deleteConsentFn(consentIndex) {
        const self = this;
        return function deleteConsent() {
            const id = self.hxConsent.id(consentIndex);
            return self.deleteConsentPx(id)
                .then(() => {
                    self.hxConsent.remove(consentIndex);
                });
        };
    }

    getConsentByNameFn(index) {
        const self = this;
        return function getConsentByName() {
            const name = self.hxConsent.client(index).name;
            return self.getConsentByNamePx(name)
                .then((consent) => {
                    const expected = self.hxConsent.server(index);
                    expect(consent).to.deep.equal(expected);
                });
        };
    }

    listConsentDocumentsFn(consentIndex, options = {}) {
        const self = this;
        return function listConsentDocuments() {
            const id = self.hxConsent.id(consentIndex);
            return self.listConsentDocumentsPx(id, options)
                .then((consent) => {
                    const typeIndices = self.consentSpecs[consentIndex];
                    const expected = self.formExpectedConsent(consentIndex, typeIndices, null, options);
                    comparator.consent(expected, consent);
                });
        };
    }

    listTranslatedConsentDocumentsFn(consentIndex) {
        const self = this;
        return function listTranslatedConsentDocuments() {
            const id = self.hxConsent.id(consentIndex);
            return self.listTranslatedConsentDocumentsPx(id, 'es')
                .then((consent) => {
                    const typeIndices = self.consentSpecs[consentIndex];
                    const expected = self.formTranslatedExpectedConsent(consentIndex, typeIndices, undefined, { language: 'es' });
                    comparator.consent(expected, consent);
                    translator.isConsentDocumentTranslated(consent, 'es');
                });
        };
    }

    listConsentDocumentsByNameFn(consentIndex) {
        const self = this;
        return function listConsentDocumentsByName() {
            const name = self.hxConsent.server(consentIndex).name;
            return self.listConsentDocumentsByNamePx(name)
                .then((consent) => {
                    const typeIndices = self.consentSpecs[consentIndex];
                    const expected = self.formExpectedConsent(consentIndex, typeIndices);
                    comparator.consent(expected, consent);
                });
        };
    }

    listTranslatedConsentDocumentsByNameFn(consentIndex) {
        const self = this;
        return function listConsentDocumentsByName() {
            const name = self.hxConsent.server(consentIndex).name;
            return self.listTranslatedConsentDocumentsByNamePx(name, 'es')
                .then((consent) => {
                    const typeIndices = self.consentSpecs[consentIndex];
                    const expected = self.formTranslatedExpectedConsent(consentIndex, typeIndices, undefined, { language: 'es' });
                    comparator.consent(expected, consent);
                    translator.isConsentDocumentTranslated(consent, 'es');
                });
        };
    }

    getUserConsentDocumentsFn(userIndex, index, signatureIndices, options = {}) {
        const self = this;
        return function getUserConsentDocuments() {
            const id = self.hxConsent.id(index);
            const { id: userId, role } = self.history.user(userIndex);
            const daoOptions = { role, roleOnly: options.roleOnly };
            return self.getUserConsentDocumentsPx(userId, id, daoOptions)
                .then((consent) => {
                    const typeIndices = self.consentSpecs[index];
                    const signatures = signatureIndices.reduce((r, i) => {
                        if (Array.isArray(i)) {
                            r[i[0]] = i[1];
                        } else {
                            r[i] = 'en';
                        }
                        return r;
                    }, {});
                    const expected = self.formExpectedConsent(index, typeIndices, signatures, daoOptions);
                    comparator.consent(expected, consent);
                });
        };
    }

    getTranslatedUserConsentDocumentsFn(userIndex, index, signatureIndices, language) {
        const self = this;
        return function getUserConsentDocuments() {
            const id = self.hxConsent.id(index);
            const { id: userId, role } = self.history.user(userIndex);
            const daoOptions = { role, language };
            return self.getUserConsentDocumentsPx(userId, id, daoOptions)
                .then((consent) => {
                    const typeIndices = self.consentSpecs[index];
                    const signatures = signatureIndices.reduce((r, i) => {
                        if (Array.isArray(i)) {
                            r[i[0]] = i[1];
                        } else {
                            r[i] = 'en';
                        }
                        return r;
                    }, {});
                    const expected = self.formTranslatedExpectedConsent(index, typeIndices, signatures, { language, role });
                    comparator.consent(expected, consent);
                    translator.isConsentDocumentTranslated(consent, language);
                });
        };
    }

    getUserConsentDocumentsByNameFn(userIndex, index, signatureIndices, options = {}) {
        const self = this;
        return function getUserConsentDocuments() {
            const name = self.hxConsent.server(index).name;
            const { id: userId, role } = self.history.user(userIndex);
            const daoOptions = { role, roleOnly: options.roleOnly };
            return self.getUserConsentDocumentsByNamePx(userId, name, daoOptions)
                .then((consent) => {
                    const typeIndices = self.consentSpecs[index];
                    const signatures = signatureIndices.reduce((r, i) => {
                        if (Array.isArray(i)) {
                            r[i[0]] = i[1];
                        } else {
                            r[i] = 'en';
                        }
                        return r;
                    }, {});
                    const expected = self.formExpectedConsent(index, typeIndices, signatures, daoOptions);
                    comparator.consent(expected, consent);
                });
        };
    }

    getTranslatedUserConsentDocumentsByNameFn(userIndex, index, signatureIndices, language) {
        const self = this;
        return function getUserConsentDocuments() {
            const name = self.hxConsent.server(index).name;
            const { id: userId, role } = self.history.user(userIndex);
            const daoOptions = { role, language };
            return self.getUserConsentDocumentsByNamePx(userId, name, daoOptions)
                .then((consent) => {
                    const typeIndices = self.consentSpecs[index];
                    const signatures = signatureIndices.reduce((r, i) => {
                        if (Array.isArray(i)) {
                            r[i[0]] = i[1];
                        } else {
                            r[i] = 'en';
                        }
                        return r;
                    }, {});
                    const expected = self.formTranslatedExpectedConsent(index, typeIndices, signatures, { language, role });
                    translator.isConsentDocumentTranslated(consent, language);
                    comparator.consent(expected, consent);
                });
        };
    }
};

const SpecTests = class ConsentTypeSpecTests extends BaseTests {
    constructor(params) {
        super(params);
        this.models = models;
    }

    listConsentsPx() {
        return this.models.consent.listConsents();
    }

    deleteConsentPx(id) {
        return this.models.consent.deleteConsent(id);
    }

    getConsentByNamePx(name) {
        return this.models.consent.getConsentByName(name);
    }

    listConsentDocumentsPx(id, options) {
        return this.models.consent.getConsentDocuments(id, options);
    }

    listTranslatedConsentDocumentsPx(id, language) {
        return this.models.consent.getConsentDocuments(id, { language });
    }

    listConsentDocumentsByNamePx(name) {
        return this.models.consent.getConsentDocumentsByName(name);
    }

    listTranslatedConsentDocumentsByNamePx(name, language) {
        return this.models.consent.getConsentDocumentsByName(name, { language });
    }

    getUserConsentDocumentsPx(userId, id, daoOptions) {
        return this.models.consent.getUserConsentDocuments(userId, id, daoOptions);
    }

    getUserConsentDocumentsByNamePx(userId, name, daoOptions) {
        return this.models.consent.getUserConsentDocumentsByName(userId, name, daoOptions);
    }

    signDocumentsFn(userIndex, index, newSignatureIndices, language) {
        const self = this;
        return function signDocuments() {
            const userId = self.history.userId(userIndex);
            const documentIds = newSignatureIndices.map(i => self.history.id(i));
            return models.consentSignature.bulkCreateSignatures(documentIds, { userId, language });
        };
    }

    errorGetConsentFn(index, errKey) {
        const self = this;
        return function errorGetConsent() {
            const errFn = errSpec.expectedErrorHandlerFn(errKey);
            const id = self.hxConsent.id(index);
            return self.models.consent.getConsentDocuments(id)
                .then(errSpec.throwingHandler, errFn);
        };
    }
};

const IntegrationTests = class ConsentIntegrationTests extends BaseTests {
    constructor(rrSuperTest, params) {
        super(params);
        this.rrSuperTest = rrSuperTest;
        this.browserIndex = 0;
        this.browserMap = new Map();
    }

    listConsentsPx() {
        return this.rrSuperTest.get('/consents', true, 200)
            .then(res => res.body);
    }

    deleteConsentPx(id) {
        return this.rrSuperTest.delete(`/consents/${id}`, 204);
    }

    getConsentByNamePx(name) {
        return this.rrSuperTest.get(`/consents/name/${name}`, true, 200)
            .then(res => res.body);
    }

    listConsentDocumentsPx(id, daoOptions) {
        const options = {};
        if (daoOptions.role) {
            options.role = daoOptions.role;
        }
        if (daoOptions.roleOnly) {
            options['role-only'] = daoOptions.roleOnly;
        }
        return this.rrSuperTest.get(`/consents/${id}/documents`, true, 200, options)
            .then(res => res.body);
    }

    listTranslatedConsentDocumentsPx(id, language) {
        return this.rrSuperTest.get(`/consents/${id}/documents`, true, 200, { language })
            .then(res => res.body);
    }

    listConsentDocumentsByNamePx(name) {
        return this.rrSuperTest.get(`/consents/name/${name}/documents`, true, 200)
            .then(res => res.body);
    }

    listTranslatedConsentDocumentsByNamePx(name, language) {
        return this.rrSuperTest.get(`/consents/name/${name}/documents`, true, 200, { language })
            .then(res => res.body);
    }

    getUserConsentDocumentsPx(userId, id, daoOptions) {
        const params = {};
        if (daoOptions.roleOnly) {
            params['role-only'] = true;
        }
        if (daoOptions.language) {
            params.language = daoOptions.language;
        }
        return this.rrSuperTest.get(`/consents/${id}/user-documents`, true, 200, params)
            .then(res => res.body);
    }

    getUserConsentDocumentsByNamePx(userId, name, daoOptions) {
        const params = {};
        if (daoOptions.roleOnly) {
            params['role-only'] = true;
        }
        if (daoOptions.language) {
            params.language = daoOptions.language;
        }
        return this.rrSuperTest.get(`/consents/name/${name}/user-documents`, true, 200, params)
            .then(res => res.body);
    }

    signDocumentsFn(userIndex, index, newSignatureIndices, inlanguage) {
        const self = this;
        return function signDocuments() {
            const language = inlanguage || 'en';
            const consentDocumentIds = newSignatureIndices.map(i => self.history.id(i));
            const input = { consentDocumentIds };
            if (language) {
                input.language = language;
            }
            self.browserIndex += 1;
            const browserIndex = self.browserIndex;
            const userAgent = `Browser-${browserIndex}`;
            const ip = `9848.3${browserIndex}.838`;
            const userId = self.history.hxUser.id(userIndex);
            consentDocumentIds.forEach((documentId) => {
                self.browserMap.set(`${userId}.${documentId}`, { userAgent, ip });
            });
            const header = {
                'User-Agent': userAgent,
                'X-Forwarded-For': [ip, `111.${browserIndex}0.999`],
            };
            return self.rrSuperTest.post('/consent-signatures/bulk', input, 201, header);
        };
    }

    checkIpAndBroswerFn() {
        const self = this;
        return function checkIpAndBroswer() {
            const query = 'select registry_user.id as "userId", consent_document.id as "documentId", ip, user_agent as "userAgent" from consent_signature, consent_document, registry_user where consent_signature.user_id = registry_user.id and consent_signature.consent_document_id = consent_document.id';
            return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
                .then((result) => {
                    result.forEach(({ userId, documentId, userAgent, ip }) => {
                        const expected = self.browserMap.get(`${userId}.${documentId}`);
                        expect({ userAgent, ip }).to.deep.equal(expected);
                    });
                });
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
