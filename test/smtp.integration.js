/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');

const config = require('../config');

const expect = chai.expect;

describe('smtp integration', () => {
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest);

    before(shared.setUpFn());

    let smtp;
    let smtpText;
    let smtpTextTranslation = {};

    const checkNull = function (done) {
        rrSuperTest.get('/smtp', true, 200)
            .expect((res) => {
                expect(res.body.exists).to.equal(false);
            })
            .end(done);
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
        return function createSmtp(done) {
            const newSmtp = createNewSmtp(index);
            const newSmtpText = createNewSmtpText(index);
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
            rrSuperTest.post('/smtp', newSmtp, 204)
                .expect(() => {
                    smtp = newSmtp;
                    if (withText) {
                        smtpText = newSmtpText;
                        smtpTextTranslation = {};
                    }
                })
                .end(done);
        };
    };

    const updateSmtpTextFn = function (index, language) {
        return function updateSmtpText(done) {
            const text = createNewSmtpText(index);
            language = language || 'en';
            rrSuperTest.patch(`/smtp/text/${language}`, text, 204)
                .expect(() => {
                    smtpText = text;
                })
                .end(done);
        };
    };

    const getSmtpFn = function () {
        return function getSmtp(done) {
            rrSuperTest.get('/smtp', true, 200)
                .expect((res) => {
                    const expected = _.cloneDeep(smtp);
                    if (smtpText) {
                        Object.assign(expected, smtpText);
                    }
                    expect(res.body.exists).to.equal(true);
                    expect(res.body.smtp).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const getTranslatedSmtpFn = function (language, checkFields) {
        return function getTranslatedSmtp(done) {
            rrSuperTest.get('/smtp', true, 200, { language })
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
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
                    return done();
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
            return function transSmtp2(done) {
                const translation = translateSmtp(smtpText, language);
                rrSuperTest.patch(`/smtp/text/${language}`, translation, 204)
                    .expect(() => {
                        smtpTextTranslation[language] = translation;
                    })
                    .end(done);
            };
        };
    }());

    const deleteSmtpFn = function () {
        return function deleteSmtp(done) {
            rrSuperTest.delete('/smtp', 204).end(done);
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

    it('logout as super', shared.logoutFn());

    shared.verifyUserAudit();
});
