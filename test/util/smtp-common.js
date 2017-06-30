'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');
const chai = require('chai');

const models = require('../../models');
const SmtpGenerator = require('./generator/smtp-generator');
const translator = require('./translator');

const expect = chai.expect;

const SmtpTests = class SmtpTests {
    constructor() {
        this.smtp = new Map();
        this.smtpText = new Map();
        this.smtpTextTranslation = new Map();

        this.generator = new SmtpGenerator();
    }

    setSmtp(type, smtp) {
        this.smtp.set(type, smtp);
    }

    setSmtpText(type, text, language = 'en') {
        if (language === 'en') {
            this.smtpText.set(type, text);
        } else {
            let typeTranslations = this.smtpTextTranslation.get(type);
            if (!typeTranslations) {
                typeTranslations = {};
                this.smtpTextTranslation.set(type, typeTranslations);
            }
            typeTranslations[language] = text;
        }
    }

    getSmtpText(type, language = 'en') {
        if (language === 'en') {
            return this.smtpText.get(type);
        }
        const typeTranslations = this.smtpTextTranslation.get(type) || {};
        return typeTranslations[language];
    }

    getFullSmtp(type, language = 'en') {
        const result = _.cloneDeep(this.smtp.get(type));
        let smtpText = this.smtpText.get(type);
        if (language !== 'en') {
            const typeTranslations = this.smtpTextTranslation.get(type) || {};
            smtpText = typeTranslations[language] || smtpText;
        }
        if (smtpText) {
            Object.assign(result, smtpText);
        }
        return result;
    }

    checkNullFn(type) {
        const self = this;
        return function checkNull() {
            return self.checkNullPx(type)
                .then(result => expect(result).to.equal(null));
        };
    }

    createSmtpFn(type, withText) {
        const generator = this.generator;
        const self = this;
        return function createSmtp() {
            const newSmtp = generator.newSmtp();
            const newSmtpText = generator.newSmtpText();
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
            return self.createSmtpPx(newSmtp, type)
                .then(() => {
                    self.setSmtp(type, newSmtp);
                    if (withText) {
                        self.setSmtpText(type, newSmtpText);
                    }
                });
        };
    }

    updateSmtpTextFn(type, language) {
        const generator = this.generator;
        const self = this;
        return function updateSmtpText() {
            const text = generator.newSmtpText();
            return self.updateSmtpTextPx(text, type, language)
                .then(() => self.setSmtpText(type, text));
        };
    }

    getSmtpFn(type, explicit) {
        const self = this;
        return function getSmtp() {
            return self.getSmtpPx(type, explicit)
                .then((result) => {
                    const expected = self.getFullSmtp(type);
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    getTranslatedSmtpFn(type, language, checkFields) {
        const self = this;
        return function getTranslatedSmtp() {
            return self.getTranslatedSmtpPx(type, language)
                .then((result) => {
                    const expected = self.getFullSmtp(type, language);
                    expect(result).to.deep.equal(expected);
                    if (checkFields) { // sanity check
                        ['subject', 'content'].forEach((property) => {
                            const text = result[property];
                            const location = text.indexOf(`(${language})`);
                            expect(location).to.be.above(0);
                        });
                    }
                });
        };
    }

    translateSmtpFn(type, language) {
        const self = this;
        return function translateSmtp() {
            const smtpText = self.getSmtpText(type);
            const translation = translator.translateSmtp(smtpText, language);
            return self.translateSmtpPx(translation, language, type)
                .then(() => self.setSmtpText(type, translation, language));
        };
    }

    deleteSmtpFn(type) {
        const self = this;
        return function deleteSmtp() {
            return self.deleteSmtpPx(type);
        };
    }
};

const SpecTests = class SmtpSpecTests extends SmtpTests {
    checkNullPx(type) { // eslint-disable-line class-methods-use-this
        return models.smtp.getSmtp(type);
    }

    createSmtpPx(newSmtp, type) { // eslint-disable-line class-methods-use-this
        const data = Object.assign({ type }, newSmtp);
        return models.smtp.createSmtp(data);
    }

    updateSmtpTextPx(text, type, language) { // eslint-disable-line class-methods-use-this
        const data = Object.assign({ type }, text);
        return models.smtp.updateSmtpText(data, language);
    }

    getSmtpPx(type, explicit) { // eslint-disable-line class-methods-use-this
        const options = { type };
        if (explicit) {
            options.language = 'en';
        }
        return models.smtp.getSmtp(options);
    }

    getTranslatedSmtpPx(type, language) { // eslint-disable-line class-methods-use-this
        return models.smtp.getSmtp({ type, language });
    }

    translateSmtpPx(translation, language, type) { // eslint-disable-line class-methods-use-this
        const data = Object.assign({ type }, translation);
        return models.smtp.updateSmtpText(data, language, type);
    }

    deleteSmtpPx(type) { // eslint-disable-line class-methods-use-this
        return models.smtp.deleteSmtp(type);
    }
};

const IntegrationTests = class SmtpIntegrationTests extends SmtpTests {
    constructor(rrSuperTest) {
        super();
        this.rrSuperTest = rrSuperTest;
    }

    checkNullPx(type) {
        return this.rrSuperTest.get(`/smtp/${type}`, true, 200)
            .then((res) => {
                expect(res.body).to.deep.equal({ exists: false });
                return null;
            });
    }

    createSmtpPx(newSmtp, type) {
        return this.rrSuperTest.post(`/smtp/${type}`, newSmtp, 204);
    }

    updateSmtpTextPx(text, type, language) {
        language = language || 'en';
        return this.rrSuperTest.patch(`/smtp/${type}/text/${language}`, text, 204);
    }

    getSmtpPx(type, explicit) {
        const options = explicit ? { language: 'en' } : undefined;
        return this.rrSuperTest.get(`/smtp/${type}`, true, 200, options)
            .then((res) => {
                expect(res.body.exists).to.equal(true);
                return res.body.smtp;
            });
    }

    getTranslatedSmtpPx(type, language) {
        return this.rrSuperTest.get(`/smtp/${type}`, true, 200, { language })
            .then((res) => {
                expect(res.body.exists).to.equal(true);
                return res.body.smtp;
            });
    }

    translateSmtpPx(translation, language, type) {
        return this.rrSuperTest.patch(`/smtp/${type}/text/${language}`, translation, 204);
    }

    deleteSmtpPx(type) {
        return this.rrSuperTest.delete(`/smtp/${type}`, 204);
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
