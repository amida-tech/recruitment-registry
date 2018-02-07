'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const translator = require('./translator');
const comparator = require('./comparator');
const errSpec = require('./err-handler-spec');

const expect = chai.expect;

const BaseTests = class BaseTests {
    constructor({ generator, hxConsentDocument }) {
        this.generator = generator;
        this.hxConsentDocument = hxConsentDocument;
    }

    createConsentDocumentFn(typeIndex) {
        const self = this;
        return function createConsentDocument() {
            const hx = self.hxConsentDocument;
            const typeId = hx.typeId(typeIndex);
            const consentDoc = self.generator.newConsentDocument({ typeId });
            return self.createConsentDocumentPx(consentDoc)
                .then((server) => {
                    const prevContent = hx.server(typeIndex) && hx.server(typeIndex).content;
                    hx.push(typeIndex, consentDoc, server);
                    const content = hx.server(typeIndex).content;
                    expect(content).not.to.equal(prevContent);
                });
        };
    }

    translateConsentDocumentFn(index, language) {
        const self = this;
        return function translateConsentDocument() {
            const server = self.hxConsentDocument.server(index);
            const translation = translator.translateConsentDocument(server, language);
            return self.translateConsentDocumentPx(translation, language)
                .then(() => {
                    const hxDocument = self.hxConsentDocument.hxDocument;
                    hxDocument.translateWithServer(server, language, translation);
                });
        };
    }

    getConsentDocumentFn(typeIndex) {
        const self = this;
        return function getConsentDocument() {
            const consentDocument = self.hxConsentDocument.server(typeIndex);
            return self.getConsentDocumentPx(consentDocument.id)
                .then((result) => {
                    expect(result).to.deep.equal(consentDocument);
                });
        };
    }

    getConsentDocumentByTypeIdFn(typeIndex) {
        const self = this;
        return function getConsentDocumentByTypeName() {
            const hx = self.hxConsentDocument;
            const typeId = hx.type(typeIndex).id;
            return self.getConsentDocumentByTypeIdPx(typeId)
                .then((result) => {
                    const expected = hx.server(typeIndex);
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    errorGetConsentDocumentByTypeIdFn(typeId, errKey) {
        const self = this;
        return function errprGetConsentDocumentByTypeName() {
            const errFn = errSpec.expectedErrorHandlerFn(errKey);
            return self.errorGetConsentDocumentByTypeIdPx(typeId)
                .then(errSpec.throwingHandler, errFn);
        };
    }

    getTranslatedConsentDocumentFn(index, language) {
        const self = this;
        return function getTranslatedConsentDocument() {
            const hx = self.hxConsentDocument;
            const id = hx.id(index);
            return self.getTranslatedConsentDocumentPx(id, language)
                .then((result) => {
                    const expected = hx.hxDocument.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    listConsentDocumentsFn(options = {}) {
        const self = this;
        return function listConsentDocuments() {
            const hx = self.hxConsentDocument;
            const daoOptions = { summary: true, keepTypeId: true };
            if (options.detailed) {
                daoOptions.summary = false;
            }
            Object.assign(daoOptions, _.pick(options, ['language', 'role', 'roleOnly']));
            return self.listConsentDocumentsPx(daoOptions)
                .then((consentDocuments) => {
                    const expected = hx.listServers(options);
                    comparator.consentDocuments(expected, consentDocuments);
                });
        };
    }

    listConsentDocumentsHistoryFn() {
        const self = this;
        return function listAllConsentDocuments() {
            const hx = self.hxConsentDocument;
            const options = { history: true, summary: false, keepTypeId: false };
            return self.listConsentDocumentsPx(options)
                .then((consentDocuments) => {
                    const expected = hx.serversHistory();
                    comparator.consentDocuments(expected, consentDocuments);
                    return expected;
                });
        };
    }

    getUpdateCommentHistoryFn(typeIndex) {
        const self = this;
        return function getUpdateCommentHistory() {
            const hx = self.hxConsentDocument;
            const typeId = hx.typeId(typeIndex);
            return self.getUpdateCommentHistoryPx(typeId)
                .then((result) => {
                    const servers = hx.serversHistory().filter(h => (h.typeId === typeId));
                    const comments = _.map(servers, 'updateComment');
                    expect(result).to.deep.equal(comments);
                });
        };
    }

    getTranslatedUpdateCommentHistoryFn(typeIndex, language) {
        const self = this;
        return function getTranslatedUpdateCommentHistory() {
            const hx = self.hxConsentDocument;
            const typeId = hx.typeId(typeIndex);
            return self.getTranslatedUpdateCommentHistoryPx(typeId, language)
                .then((result) => {
                    const servers = hx.translatedServersHistory(language)
                        .filter(h => (h.typeId === typeId));
                    const comments = _.map(servers, 'updateComment');
                    expect(result).to.deep.equal(comments);
                });
        };
    }
};

const SpecTests = class ConsentTypeSpecTests extends BaseTests {
    constructor(params) {
        super(params);
        this.models = models;
    }

    createConsentDocumentPx(consentDoc) {
        return this.models.consentDocument.createConsentDocument(consentDoc);
    }

    translateConsentDocumentPx(translation, language) {
        return this.models.consentDocument.updateConsentDocumentText(translation, language);
    }

    getConsentDocumentPx(id) {
        return this.models.consentDocument.getConsentDocument(id);
    }

    getConsentDocumentByTypeIdPx(typeId) {
        return this.models.consentDocument.getConsentDocumentByTypeId(typeId);
    }

    errorGetConsentDocumentByTypeIdPx(typeId) {
        return this.models.consentDocument.getConsentDocumentByTypeId(typeId);
    }

    getTranslatedConsentDocumentPx(id, language) {
        return this.models.consentDocument.getConsentDocument(id, { language });
    }

    listConsentDocumentsPx(options) {
        return this.models.consentDocument.listConsentDocuments(options);
    }

    getUpdateCommentHistoryPx(typeId) {
        return this.models.consentDocument.getUpdateCommentHistory(typeId);
    }

    getTranslatedUpdateCommentHistoryPx(typeId, language) {
        return this.models.consentDocument.getUpdateCommentHistory(typeId, language);
    }
};

const IntegrationTests = class ConsentTypeIntegrationTests extends BaseTests {
    constructor(rrSuperTest, params) {
        super(params);
        this.rrSuperTest = rrSuperTest;
    }

    createConsentDocumentPx(consentDoc) {
        return this.rrSuperTest.post('/consent-documents', consentDoc, 201)
            .then(res => res.body);
    }

    translateConsentDocumentPx(translation, language) {
        return this.rrSuperTest.patch(`/consent-documents/text/${language}`, translation, 204);
    }

    getConsentDocumentPx(id) {
        return this.rrSuperTest.get(`/consent-documents/${id}`, false, 200)
            .then(res => res.body);
    }

    getConsentDocumentByTypeIdPx(typeId) {
        return this.rrSuperTest.get(`/consent-documents/type/${typeId}`, false, 200)
            .then(res => res.body);
    }

    getTranslatedConsentDocumentPx(id, language) {
        return this.rrSuperTest.get(`/consent-documents/${id}`, false, 200, { language })
            .then(res => res.body);
    }

    listConsentDocumentsPx(options = {}) {
        const params = {};
        if (options.language) {
            params.language = options.language;
        }
        if (options.history) {
            params.history = options.history;
        }
        if (options.summary !== undefined) {
            params.summary = options.summary;
        }
        if (options.keepTypeId !== undefined) {
            params['keep-type-id'] = options.keepTypeId;
        }
        if (options.roleOnly) {
            params['role-only'] = true;
        }
        if (options.role) {
            params.role = options.role;
        }
        return this.rrSuperTest.get('/consent-documents', false, 200, params)
            .then(res => res.body);
    }

    getUpdateCommentHistoryPx(typeId) {
        return this.rrSuperTest.get(`/consent-documents/type-id/${typeId}/update-comments`, false, 200);
    }

    getTranslatedUpdateCommentHistoryPx(typeId, language) {
        return this.rrSuperTest.get(`/consent-documents/type-id/${typeId}/update-comments`, false, 200, { language });
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
