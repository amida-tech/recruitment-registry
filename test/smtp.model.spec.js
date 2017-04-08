/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const models = require('../models');

const expect = chai.expect;

const shared = new SharedSpec();

describe('smtp unit', () => {
    before(shared.setUpFn());

    let smtp;
    let smtpText;
    let smtpTextTranslation = {};

    const checkNull = function () {
        return models.smtp.getSmtp()
            .then(result => expect(result).to.equal(null));
    };

    const createNewSmtp = function (index) {
        return {
            protocol: `protocol_${index}`,
            username: `username_${index}`,
            password: `password_${index}`,
            host: `host_${index}`,
            from: `from_${index}`,
            otherOptions: {
                key1: `key1_${index}`,
                key2: `key2_${index}`,
            },
        };
    };

    const createNewSmtpText = function (index) {
        const actualLink = '${link}'; // eslint-disable-line no-template-curly-in-string
        return {
            subject: `subject_${index}`,
            content: `content_${index} with link:${actualLink}`,
        };
    };

    const createSmtpFn = function (index, withText) {
        return function createSmtp() {
            const newSmtp = createNewSmtp(index);
            const newSmtpText = createNewSmtpText(index);
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
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

    const updateSmtpTextFn = function (index, language) {
        return function updateSmtpText() {
            const text = createNewSmtpText(index);
            return models.smtp.updateSmtpText(text, language)
                .then(() => (smtpText = text));
        };
    };

    const getSmtpFn = function () {
        return function getSmtp() {
            return models.smtp.getSmtp()
                .then((result) => {
                    const expected = _.cloneDeep(smtp);
                    if (smtpText) {
                        Object.assign(expected, smtpText);
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const getTranslatedSmtpFn = function (language, checkFields) {
        return function getTranslatedSmtp() {
            return models.smtp.getSmtp({ language })
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

    const translateSmtpFn = (function translateSmtpGen() {
        const translateSmtp = function (server, language) {
            return {
                subject: `${server.subject} (${language})`,
                content: `${server.content} (${language})`,
            };
        };

        return function transSmtp(language) {
            return function transSmtp2() {
                const translation = translateSmtp(smtpText, language);
                return models.smtp.updateSmtpText(translation, language)
                    .then(() => {
                        smtpTextTranslation[language] = translation;
                    });
            };
        };
    }());

    const deleteSmtpFn = function () {
        return function deleteSmtp() {
            return models.smtp.deleteSmtp();
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

    it('get/verify smtp settings in explicit english', getSmtpFn('en'));

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
