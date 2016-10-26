/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const Shared = require('./util/shared-integration');

const config = require('../config');

const expect = chai.expect;

const shared = new Shared();

describe('smtp integration', function () {
    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    let smtp;
    let smtpText;
    let smtpTextTranslation = {};

    const checkNull = function (done) {
        store.server
            .get('/api/v1.0/smtp')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.equal(null);
                done();
            });
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
                key2: `key2_${index}`
            }
        };
    };

    const createNewSmtpText = function (index) {
        return {
            subject: `subject_${index}`,
            content: `content_${index} with link:` + '${link}'
        };
    };

    const createSmtpFn = function (index, withText) {
        return function (done) {
            const newSmtp = createNewSmtp(index);
            const newSmtpText = createNewSmtpText(index);
            if (withText) {
                Object.assign(newSmtp, newSmtpText);
            }
            store.server
                .post('/api/v1.0/smtp')
                .set('Authorization', store.auth)
                .send(newSmtp)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    smtp = newSmtp;
                    if (withText) {
                        smtpText = newSmtpText;
                        smtpTextTranslation = {};
                    }
                    done();
                });
        };
    };

    const updateSmtpTextFn = function (index, language) {
        return function (done) {
            const text = createNewSmtpText(index);
            language = language || 'en';
            store.server
                .patch(`/api/v1.0/smtp/text/${language}`)
                .set('Authorization', store.auth)
                .send(text)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    smtpText = text;
                    done();
                });
        };
    };

    const getSmtpFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/smtp')
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    let expected = _.cloneDeep(smtp);
                    if (smtpText) {
                        Object.assign(expected, smtpText);
                    }
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    const getTranslatedSmtpFn = function (language, checkFields) {
        return function (done) {
            store.server
                .get('/api/v1.0/smtp')
                .set('Authorization', store.auth)
                .query({ language })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = _.cloneDeep(smtp);
                    let translation = smtpTextTranslation[language];
                    if (!translation) {
                        translation = smtpText;
                    }
                    Object.assign(expected, translation);
                    expect(res.body).to.deep.equal(expected);
                    if (checkFields) { // sanity check
                        ['subject', 'content'].forEach(property => {
                            const text = res.body[property];
                            const location = text.indexOf(`(${language})`);
                            expect(location).to.be.above(0);
                        });
                    }
                    done();
                });
        };
    };

    const translateSmtpFn = (function () {
        const translateSmtp = function (server, language) {
            return {
                subject: server.subject + ` (${language})`,
                content: server.content + ` (${language})`
            };
        };

        return function (language) {
            return function (done) {
                const translation = translateSmtp(smtpText, language);
                store.server
                    .patch(`/api/v1.0/smtp/text/${language}`)
                    .set('Authorization', store.auth)
                    .send(translation)
                    .expect(204)
                    .end(function (err) {
                        if (err) {
                            return done(err);
                        }
                        smtpTextTranslation[language] = translation;
                        done();
                    });
            };
        };
    })();

    const deleteSmtpFn = function () {
        return function (done) {
            store.server
                .delete(`/api/v1.0/smtp`)
                .set('Authorization', store.auth)
                .expect(204, done);
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));

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

    it('logout as super', shared.logoutFn(store));

});
