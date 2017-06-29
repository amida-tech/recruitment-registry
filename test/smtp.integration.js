/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const SmtpGenerator = require('./util/generator/smtp-generator');
const translator = require('./util/translator');

const config = require('../config');

const expect = chai.expect;

describe('smtp integration', () => {
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest);

    before(shared.setUpFn());

    let smtp;
    let smtpText;
    let smtpTextTranslation = {};

    const generator = new SmtpGenerator();

    const checkNull = function () {
        const type = 'reset-password';
        rrSuperTest.get(`/smtp/${type}`, true, 200)
            .then((res) => {
                expect(res.body.exists).to.equal(false);
            });
    };

    const createSmtpFn = function (index, withText, type = 'reset-password') {
        return function createSmtp() {
            const newSmtp = generator.newSmtp(index);
            const newSmtpText = generator.newSmtpText(index);
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
            return rrSuperTest.post(`/smtp/${type}`, newSmtp, 204)
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
            const text = generator.newSmtpText(index);
            language = language || 'en';
            rrSuperTest.patch(`/smtp/${type}/text/${language}`, text, 204)
                .then(() => {
                    smtpText = text;
                });
        };
    };

    const getSmtpFn = function (explicit, type = 'reset-password') {
        return function getSmtp() {
            const options = explicit ? { language: 'en' } : undefined;
            return rrSuperTest.get(`/smtp/${type}`, true, 200, options)
                .then((res) => {
                    const expected = _.cloneDeep(smtp);
                    if (smtpText) {
                        Object.assign(expected, smtpText);
                    }
                    expect(res.body.exists).to.equal(true);
                    expect(res.body.smtp).to.deep.equal(expected);
                });
        };
    };

    const getTranslatedSmtpFn = function (language, checkFields, type = 'reset-password') {
        return function getTranslatedSmtp() {
            return rrSuperTest.get(`/smtp/${type}`, true, 200, { language })
                .then((res) => {
                    const expected = _.cloneDeep(smtp);
                    let translation = smtpTextTranslation[language];
                    if (!translation) {
                        translation = smtpText;
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
    };

    const translateSmtpFn = function (language, type = 'reset-password') {
        return function transSmtp2() {
            const translation = translator.translateSmtp(smtpText, language);
            return rrSuperTest.patch(`/smtp/${type}/text/${language}`, translation, 204)
                .then(() => {
                    smtpTextTranslation[language] = translation;
                });
        };
    };

    const deleteSmtpFn = function (type = 'reset-password') {
        return function deleteSmtp() {
            return rrSuperTest.delete(`/smtp/${type}`, 204);
        };
    };

    it('login as super', shared.loginFn(config.superUser));

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

    it('logout as super', shared.logoutFn());

    shared.verifyUserAudit();
});
