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
        this.smtp = null;
        this.smtpText = null;
        this.smtpTextTranslation = {};

        this.generator = new SmtpGenerator();
    }

    checkNullFn() {
        const self = this;
        return function checkNull(type = 'reset-password') {
            return self.checkNullPx(type)
                .then(result => expect(result).to.equal(null));
        };
    }

    createSmtpFn(withText, type = 'reset-password') {
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
                    self.smtp = newSmtp;
                    if (withText) {
                        self.smtpText = newSmtpText;
                        self.smtpTextTranslation = {};
                    }
                });
        };
    }

    updateSmtpTextFn(language, type = 'reset-password') {
        const generator = this.generator;
        const self = this;
        return function updateSmtpText() {
            const text = generator.newSmtpText();
            return self.updateSmtpTextPx(text, type, language)
                .then(() => (self.smtpText = text));
        };
    }

    getSmtpFn(explicit, type = 'reset-password') {
        const self = this;
        return function getSmtp() {
            return self.getSmtpPx(type, explicit)
                .then((result) => {
                    const expected = _.cloneDeep(self.smtp);
                    if (self.smtpText) {
                        Object.assign(expected, self.smtpText);
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    getTranslatedSmtpFn(language, checkFields, type = 'reset-password') {
        const self = this;
        return function getTranslatedSmtp() {
            return self.getTranslatedSmtpPx(type, language)
                .then((result) => {
                    const expected = _.cloneDeep(self.smtp);
                    let translation = self.smtpTextTranslation[language];
                    if (!translation) {
                        translation = self.smtpText;
                    }
                    Object.assign(expected, translation);
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

    translateSmtpFn(language, type = 'reset-password') {
        const self = this;
        return function translateSmtp() {
            const translation = translator.translateSmtp(self.smtpText, language);
            return self.translateSmtpPx(translation, language, type)
                .then(() => {
                    self.smtpTextTranslation[language] = translation;
                });
        };
    }

    deleteSmtpFn(type = 'reset-password') {
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
        const data = Object.assign(newSmtp, { type });
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
