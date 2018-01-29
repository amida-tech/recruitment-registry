'use strict';

const chai = require('chai');

const models = require('../../models');
const translator = require('./translator');

const expect = chai.expect;

const BaseTests = class BaseTests {
    constructor({ generator, hxConsentDocument }) {
        this.generator = generator;
        this.hxConsentDocument = hxConsentDocument;
    }

    createConsentDocumentFn(typeIndex) {
        const self = this;
        return function createConsentDocument() {
            const typeId = self.hxConsentDocument.typeId(typeIndex);
            const consentDoc = self.generator.newConsentDocument({ typeId });
            return self.createConsentDocumentPx(consentDoc)
                .then((server) => {
                    self.hxConsentDocument.push(typeIndex, consentDoc, server);
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

    getTranslatedConsentDocumentPx(id, language) {
        return this.models.consentDocument.getConsentDocument(id, { language });
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
        this.rrSuperTest.patch(`/consent-documents/text/${language}`, translation, 204);
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
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
