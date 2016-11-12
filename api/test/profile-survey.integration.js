/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../config');
const RRError = require('../lib/rr-error');

const SharedIntegration = require('./util/shared-integration');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const translator = require('./util/translator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('profile survey integration', function () {
    const store = {
        server: null,
        auth: null
    };

    const hxSurvey = new History(['id', 'name']);

    before(shared.setUpFn(store));

    it('error: create profile survey unauthorized', function (done) {
        const clientSurvey = generator.newSurvey();
        store.server
            .post('/api/v1.0/profile-survey')
            .send(clientSurvey)
            .expect(401)
            .end(done);
    });

    it('error: get profile survey when none created', function (done) {
        store.server
            .get('/api/v1.0/profile-survey')
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                }
                const message = RRError.message('registryNoProfileSurvey');
                expect(res.body.message).to.equal(message);
                done();
            });

    });

    const createProfileSurveyFn = function () {
        return function (done) {
            const clientSurvey = generator.newSurvey();
            store.server
                .post('/api/v1.0/profile-survey')
                .set('Authorization', store.auth)
                .send(clientSurvey)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.push(clientSurvey, res.body);
                    done();
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));

    it('create profile survey 0', createProfileSurveyFn());

    it('logout as super', shared.logoutFn(store));

    const verifyProfileSurveyFn = function (index) {
        return function (done) {
            store.server
                .get('/api/v1.0/profile-survey')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const id = hxSurvey.id(index);
                    expect(res.body.id).to.equal(id);
                    hxSurvey.updateServer(index, res.body);
                    comparator.survey(hxSurvey.client(index), res.body)
                        .then(done, done);
                });
        };
    };

    const translateProfileSurveyFn = function (index, language) {
        return function (done) {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            delete translation.id;
            store.server
                .patch(`/api/v1.0/profile-survey/text/${language}`)
                .set('Authorization', store.auth)
                .send(translation)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.translate(index, language, translation);
                    done();
                });
        };
    };

    const verifyNotTranslatedProfileSurveyFn = function (index, language) {
        return function (done) {
            store.server
                .get(`/api/v1.0/profile-survey`)
                .set('Authorization', store.auth)
                .query({ language })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const survey = hxSurvey.server(index);
                    expect(res.body).to.deep.equal(survey);
                    done();
                });
        };
    };

    const verifyTranslatedProfileSurveyFn = function (index, language) {
        return function (done) {
            store.server
                .get(`/api/v1.0/profile-survey`)
                .set('Authorization', store.auth)
                .query({ language })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    translator.isSurveyTranslated(res.body, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    it(`get profile survey 0`, verifyProfileSurveyFn(0));

    it('get profile survey 0 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(0, 'es'));

    it('login as super', shared.loginFn(store, config.superUser));

    it('translate profile survey 0 to spanish', translateProfileSurveyFn(0, 'es'));

    it('logout as super', shared.logoutFn(store));

    it('get/verify translated profile survey 0 (spanish)', verifyTranslatedProfileSurveyFn(0, 'es'));

    it('login as super', shared.loginFn(store, config.superUser));

    it('create profile survey 1', createProfileSurveyFn());

    it('logout as super', shared.logoutFn(store));

    it('get/verify profile survey 1', verifyProfileSurveyFn(1));

    it('get profile survey 1 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(1, 'es'));

    it('login as super', shared.loginFn(store, config.superUser));

    it('translate profile survey 1 to spanish', translateProfileSurveyFn(1, 'es'));

    it('logout as super', shared.logoutFn(store));

    it('get/verify translated profile survey 1 (spanish)', verifyTranslatedProfileSurveyFn(1, 'es'));
});
