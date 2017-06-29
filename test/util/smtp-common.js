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
};

const SpecTests = class SmtpSpecTests extends SmtpTests {
    checkNullFn() { // eslint-disable-line class-methods-use-this
        return function checkNull(type = 'reset-password') { // eslint-disable-line class-methods-use-this
            return models.smtp.getSmtp(type)
                .then(result => expect(result).to.equal(null));
        };
    }

    createSmtpFn(index, withText, type = 'reset-password') {
        const generator = this.generator;
        const self = this;
        return function createSmtp() {
            const newSmtp = generator.newSmtp(index, type);
            const newSmtpText = generator.newSmtpText(index, type);
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
            Object.assign(newSmtp, { type });
            return models.smtp.createSmtp(newSmtp)
                .then(() => {
                    self.smtp = newSmtp;
                    if (withText) {
                        self.smtpText = newSmtpText;
                        self.smtpTextTranslation = {};
                    }
                });
        };
    }

    updateSmtpTextFn(index, language, type = 'reset-password') {
        const generator = this.generator;
        const self = this;
        return function updateSmtpText() {
            const text = generator.newSmtpText(index, type);
            Object.assign(text, { type });
            return models.smtp.updateSmtpText(text, language)
                .then(() => (self.smtpText = text));
        };
    }

    getSmtpFn(explicit, type = 'reset-password') {
        const self = this;
        return function getSmtp() {
            const options = { type };
            if (explicit) {
                options.language = 'en';
            }
            return models.smtp.getSmtp(options)
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
            return models.smtp.getSmtp({ type, language })
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
            Object.assign(translation, { type });
            return models.smtp.updateSmtpText(translation, language, type)
                .then(() => {
                    self.smtpTextTranslation[language] = translation;
                });
        };
    }

    deleteSmtpFn() { // eslint-disable-line class-methods-use-this
        return function deleteSmtp(type = 'reset-password') {
            return models.smtp.deleteSmtp(type);
        };
    }
};

const IntegrationTests = class SmtpIntegrationTests extends SmtpTests {
    constructor(rrSuperTest) {
        super();
        this.rrSuperTest = rrSuperTest;
    }

    checkNullFn() {
        const rrSuperTest = this.rrSuperTest;
        return function checkNull() {
            const type = 'reset-password';
            return rrSuperTest.get(`/smtp/${type}`, true, 200)
                .then((res) => {
                    expect(res.body.exists).to.equal(false);
                });
        };
    }

    createSmtpFn(index, withText, type = 'reset-password') {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const self = this;
        return function createSmtp() {
            const newSmtp = generator.newSmtp(index);
            const newSmtpText = generator.newSmtpText(index);
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
            return rrSuperTest.post(`/smtp/${type}`, newSmtp, 204)
                .then(() => {
                    self.smtp = newSmtp;
                    if (withText) {
                        self.smtpText = newSmtpText;
                        self.smtpTextTranslation = {};
                    }
                });
        };
    }

    updateSmtpTextFn(index, language, type = 'reset-password') {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const self = this;
        return function updateSmtpText() {
            const text = generator.newSmtpText(index);
            language = language || 'en';
            return rrSuperTest.patch(`/smtp/${type}/text/${language}`, text, 204)
                .then(() => {
                    self.smtpText = text;
                });
        };
    }

    getSmtpFn(explicit, type = 'reset-password') {
        const self = this;
        const rrSuperTest = this.rrSuperTest;
        return function getSmtp() {
            const options = explicit ? { language: 'en' } : undefined;
            return rrSuperTest.get(`/smtp/${type}`, true, 200, options)
                .then((res) => {
                    const expected = _.cloneDeep(self.smtp);
                    if (self.smtpText) {
                        Object.assign(expected, self.smtpText);
                    }
                    expect(res.body.exists).to.equal(true);
                    expect(res.body.smtp).to.deep.equal(expected);
                });
        };
    }

    getTranslatedSmtpFn(language, checkFields, type = 'reset-password') {
        const self = this;
        const rrSuperTest = this.rrSuperTest;
        return function getTranslatedSmtp() {
            return rrSuperTest.get(`/smtp/${type}`, true, 200, { language })
                .then((res) => {
                    const expected = _.cloneDeep(self.smtp);
                    let translation = self.smtpTextTranslation[language];
                    if (!translation) {
                        translation = self.smtpText;
                    }
                    Object.assign(expected, translation);
                    expect(res.body.exists).to.equal(true);
                    const smtpr = res.body.smtp;
                    expect(smtpr).to.deep.equal(expected);
                    if (checkFields) { // sanity check
                        ['subject', 'content'].forEach((property) => {
                            const text = smtpr[property];
                            const location = text.indexOf(`(${language})`);
                            expect(location).to.be.above(0);
                        });
                    }
                });
        };
    }

    translateSmtpFn(language, type = 'reset-password') {
        const rrSuperTest = this.rrSuperTest;
        const self = this;
        return function transSmtp2() {
            const translation = translator.translateSmtp(self.smtpText, language);
            return rrSuperTest.patch(`/smtp/${type}/text/${language}`, translation, 204)
                .then(() => {
                    self.smtpTextTranslation[language] = translation;
                });
        };
    }

    deleteSmtpFn(type = 'reset-password') {
        const rrSuperTest = this.rrSuperTest;
        return function deleteSmtp() {
            return rrSuperTest.delete(`/smtp/${type}`, 204);
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
