'use strict';

const chai = require('chai');

const models = require('../../models');
const translator = require('./translator');
const errSpec = require('./err-handler-spec');

const expect = chai.expect;

const BaseTests = class BaseTests {
    constructor({ generator, hxConsentType }) {
        this.generator = generator;
        this.hxConsentType = hxConsentType;
    }

    createConsentTypeFn(options = {}) {
        const self = this;
        return function createConsentType() {
            const consentType = self.generator.newConsentType();
            if (options.role) {
                consentType.role = options.role;
            }
            return self.createConsentTypePx(consentType)
                .then(server => self.hxConsentType.pushWithId(consentType, server.id));
        };
    }

    putConsentTypeFn(index, options = {}) {
        const self = this;
        return function createConsentType() {
            const consentType = self.generator.newConsentType();
            let translation;
            if (options.language) {
                translation = translator.translateConsentType(consentType, options.language);
                consentType.title = translation.title;
            }
            if (options.role) {
                consentType.role = options.role;
            }
            const id = self.hxConsentType.id(index);
            return self.putConsentTypePx(id, consentType, options)
                .then(() => {
                    const server = self.hxConsentType.server(index);
                    const title = server.title;
                    Object.assign(server, consentType);
                    if (!options.role) {
                        delete server.role;
                    }
                    if (options.language && options.language !== 'en') {
                        server.title = title;
                    }
                    if (options.language) {
                        self.hxConsentType.translate(index, options.language, translation);
                    }
                });
        };
    }

    getConsentTypeFn(index) {
        const self = this;
        return function getConsentType() {
            const consentType = self.hxConsentType.server(index);
            return self.getConsentTypePx(consentType.id)
                .then((result) => {
                    expect(result).to.deep.equal(consentType);
                });
        };
    }

    listConsentTypesFn() {
        const self = this;
        return function listConsentTypes() {
            return self.listConsentTypesPx()
                .then((result) => {
                    const expected = self.hxConsentType.listServers();
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    deleteConsentTypeFn(index) {
        const self = this;
        return function deleteConsentType() {
            const id = self.hxConsentType.id(index);
            return self.deleteConsentTypePx(id)
                .then(() => {
                    self.hxConsentType.remove(index);
                });
        };
    }

    getTranslatedConsentTypeFn(index, language) {
        const self = this;
        return function getTranslatedConsentType() {
            const id = self.hxConsentType.id(index);
            return self.getConsentTypePx(id, { language })
                .then((result) => {
                    const expected = self.hxConsentType.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    listTranslatedConsentTypesFn(language) {
        const self = this;
        return function listTranslatedConsentTypes() {
            return self.listConsentTypesPx({ language })
                .then((result) => {
                    const expected = self.hxConsentType.listTranslatedServers(language);
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    translateConsentTypeFn(index, language) {
        const self = this;
        return function translateConsentType() {
            const server = self.hxConsentType.server(index);
            const translation = translator.translateConsentType(server, language);
            return self.translateConsentTypePx(translation, language)
                .then(() => {
                    self.hxConsentType.translate(index, language, translation);
                });
        };
    }
};

const SpecTests = class ConsentTypeSpecTests extends BaseTests {
    constructor(params) {
        super(params);
        this.models = models;
    }

    createConsentTypePx(consent) {
        return this.models.consentType.createConsentType(consent);
    }

    putConsentTypePx(id, consentType, options) {
        return this.models.consentType.putConsentType(id, consentType, options);
    }

    getConsentTypePx(id, options = {}) {
        return this.models.consentType.getConsentType(id, options);
    }

    listConsentTypesPx(options = {}) {
        return this.models.consentType.listConsentTypes(options);
    }

    deleteConsentTypePx(id) {
        return this.models.consentType.deleteConsentType(id);
    }

    translateConsentTypePx(translation, language) {
        return this.models.consentType.updateConsentTypeText(translation, language);
    }

    errorDeleteConsentTypeFn(index, errKey) {
        const self = this;
        return function errorDeleteConsentType() {
            const errFn = errSpec.expectedErrorHandlerFn(errKey);
            const id = self.hxConsentType.id(index);
            return self.deleteConsentTypePx(id)
                .then(errSpec.throwingHandler, errFn);
        };
    }
};

const IntegrationTests = class ConsentTypeIntegrationTests extends BaseTests {
    constructor(rrSuperTest, params) {
        super(params);
        this.rrSuperTest = rrSuperTest;
    }

    createConsentTypePx(consentType) {
        return this.rrSuperTest.post('/consent-types', consentType, 201)
            .then(res => res.body);
    }

    putConsentTypePx(id, consentType, options) {
        const query = {};
        if (options.language) {
            query.language = options.language;
        }
        return this.rrSuperTest.put(`/consent-types/${id}`, consentType, 204, query);
    }

    getConsentTypePx(id, options = {}) {
        return this.rrSuperTest.get(`/consent-types/${id}`, true, 200, options)
            .then(res => res.body);
    }

    listConsentTypesPx(options = {}) {
        return this.rrSuperTest.get('/consent-types', true, 200, options)
            .then(res => res.body);
    }

    deleteConsentTypePx(id) {
        return this.rrSuperTest.delete(`/consent-types/${id}`, 204);
    }

    translateConsentTypePx(translation, language) {
        return this.rrSuperTest.patch(`/consent-types/text/${language}`, translation, 204);
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
