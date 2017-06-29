/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const models = require('../models');
const SmtpGenerator = require('./util/generator/smtp-generator');
const translator = require('./util/translator');

const expect = chai.expect;

const shared = new SharedSpec();

describe('smtp unit', () => {
    before(shared.setUpFn());

    let smtp;
    let smtpText;
    let smtpTextTranslation = {};

    const generator = new SmtpGenerator();

    const checkNull = function (type = 'reset-password') {
        return models.smtp.getSmtp(type)
            .then(result => expect(result).to.equal(null));
    };

    const createSmtpFn = function (index, withText, type = 'reset-password') {
        return function createSmtp() {
            const newSmtp = generator.newSmtp(index, type);
            const newSmtpText = generator.newSmtpText(index, type);
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
            Object.assign(newSmtp, { type });
            return models.smtp.createSmtp(newSmtp)
                .then(() => {
                    smtp = newSmtp;
                    if (withText) {
                        smtpText = newSmtpText;
                        smtpTextTranslation = {};
                    }
                });
        };
    };

    const updateSmtpTextFn = function (index, language, type = 'reset-password') {
        return function updateSmtpText() {
            const text = generator.newSmtpText(index, type);
            Object.assign(text, { type });
            return models.smtp.updateSmtpText(text, language)
                .then(() => (smtpText = text));
        };
    };

    const getSmtpFn = function (explicit, type = 'reset-password') {
        return function getSmtp() {
            const options = { type };
            if (explicit) {
                options.language = 'en';
            }
            return models.smtp.getSmtp(options)
                .then((result) => {
                    const expected = _.cloneDeep(smtp);
                    if (smtpText) {
                        Object.assign(expected, smtpText);
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const getTranslatedSmtpFn = function (language, checkFields, type = 'reset-password') {
        return function getTranslatedSmtp() {
            return models.smtp.getSmtp({ type, language })
                .then((result) => {
                    const expected = _.cloneDeep(smtp);
                    let translation = smtpTextTranslation[language];
                    if (!translation) {
                        translation = smtpText;
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
    };

    const translateSmtpFn = function (language, type = 'reset-password') {
        return function translateSmtp() {
            const translation = translator.translateSmtp(smtpText, language);
            Object.assign(translation, { type });
            return models.smtp.updateSmtpText(translation, language, type)
                .then(() => {
                    smtpTextTranslation[language] = translation;
                });
        };
    };

    const deleteSmtpFn = function () {
        return function deleteSmtp(type = 'reset-password') {
            return models.smtp.deleteSmtp(type);
        };
    };

    it('get null when no smtp server ever specified', checkNull);

    it('create smtp server setting without subject/content', createSmtpFn(0));

    it('get/verify smtp settings', getSmtpFn());

    it('add subject/content', updateSmtpTextFn(0, 'en'));

    it('get/verify smtp settings', getSmtpFn());

    it('update smtp server setting with subject/content', createSmtpFn(1, true));

    it('get/verify smtp settings', getSmtpFn());

    it('get/verify smtp settings in spanish when no translation', getTranslatedSmtpFn('es'));

    it('translate to spanish', translateSmtpFn('es'));

    it('get/verify smtp settings', getSmtpFn());

    it('get/verify smtp settings in explicit english', getSmtpFn(true));

    it('get/verify smtp settings in spanish', getTranslatedSmtpFn('es', true));

    it('update smtp server setting without subject/content', createSmtpFn(2));

    it('get/verify smtp settings', getSmtpFn());

    it('get/verify smtp settings in spanish', getTranslatedSmtpFn('es', true));

    it('delete smtp server settings', deleteSmtpFn());

    it('get null when smtp server settings deactivated', checkNull);

    it('update smtp server setting without subject/content', createSmtpFn(3));

    it('get/verify smtp settings', getSmtpFn());

    it('add subject/content', updateSmtpTextFn(1));

    it('get/verify smtp settings', getSmtpFn());

    it('get/verify smtp settings in spanish', getTranslatedSmtpFn('es', true));
});
