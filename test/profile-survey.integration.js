/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const SurveyHistory = require('./util/survey-history');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const translator = require('./util/translator');

const expect = chai.expect;
const generator = new Generator();

describe('profile survey integration', () => {
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxSurvey = new SurveyHistory();

    before(shared.setUpFn());

    it('error: create profile survey unauthorized', (done) => {
        const clientSurvey = generator.newSurvey();
        rrSuperTest.post('/profile-survey', clientSurvey, 401)
            .end(done);
    });

    const emptyProfileSurvey = function (done) {
        rrSuperTest.get('/profile-survey', false, 200)
            .expect((res) => {
                expect(res.body.exists).to.equal(false);
            })
            .end(done);
    };

    const emptyProfileSurveyId = function (done) {
        rrSuperTest.get('/profile-survey-id', false, 200)
            .expect((res) => {
                expect(res.body).to.equal(0);
            })
            .end(done);
    };

    it('get profile survey when none created', emptyProfileSurvey);

    it('get profile survey id when none created', emptyProfileSurveyId);

    const createSurvey = function (done) {
        const clientSurvey = generator.newSurvey();
        rrSuperTest.post('/surveys', clientSurvey, 201)
            .expect((res) => {
                hxSurvey.push(clientSurvey, res.body);
            })
            .end(done);
    };

    const createProfileSurveyIdFn = function (index) {
        return function createProfileSurveyId(done) {
            const id = hxSurvey.id(index);
            rrSuperTest.post('/profile-survey-id', { profileSurveyId: id }, 204)
                .end(done);
        };
    };

    const createProfileSurveyFn = function () {
        return function createProfileSurvey(done) {
            const clientSurvey = generator.newSurvey();
            rrSuperTest.post('/profile-survey', clientSurvey, 201)
                .expect((res) => {
                    hxSurvey.push(clientSurvey, res.body);
                })
                .end(done);
        };
    };

    const verifyProfileSurveyFn = function (index) {
        return function verifyProfileSurvey(done) {
            rrSuperTest.get('/profile-survey', false, 200)
                .expect((res) => {
                    const { exists, survey } = res.body;
                    expect(exists).to.equal(true);
                    const id = hxSurvey.id(index);
                    expect(survey.id).to.equal(id);
                    hxSurvey.updateServer(index, survey);
                    comparator.survey(hxSurvey.client(index), survey);
                })
                .end(done);
        };
    };

    const verifyProfileSurveyIdFn = function (index) {
        return function verifyProfileSurveyId(done) {
            rrSuperTest.get('/profile-survey-id', false, 200)
                .expect((res) => {
                    const id = hxSurvey.id(index);
                    expect(id).to.equal(res.body);
                })
                .end(done);
        };
    };

    const deleteProfileSurveyId = function (done) {
        rrSuperTest.delete('/profile-survey-id', 204)
            .end(done);
    };

    const translateSurveyFn = function (index, language) {
        return function translateSurvey(done) {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            rrSuperTest.patch(`/surveys/text/${language}`, translation, 204)
                .expect(() => {
                    hxSurvey.translate(index, language, translation);
                })
                .end(done);
        };
    };

    const verifyNotTranslatedProfileSurveyFn = function (index, language) {
        return function verifyNotTranslatedProfileSurvey(done) {
            rrSuperTest.get('/profile-survey', true, 200, { language })
                .expect((res) => {
                    const { exists, survey } = res.body;
                    expect(exists).to.equal(true);
                    const previousSurvey = hxSurvey.server(index);
                    expect(survey).to.deep.equal(previousSurvey);
                })
                .end(done);
        };
    };

    const verifyTranslatedProfileSurveyFn = function (index, language) {
        return function verifyTranslatedProfileSurvey(done) {
            rrSuperTest.get('/profile-survey', true, 200, { language })
                .expect((res) => {
                    const { exists, survey } = res.body;
                    expect(exists).to.equal(true);
                    translator.isSurveyTranslated(survey, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(survey).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(config.superUser));

    it('create survey 0', createSurvey);

    it('create profile survey 0 using id', createProfileSurveyIdFn(0));

    it('logout as super', shared.logoutFn());

    it('get/verify profile survey 0', verifyProfileSurveyFn(0));

    it('get/verify profile survey 0 id', verifyProfileSurveyIdFn(0));

    it('get profile survey 0 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(0, 'es'));

    it('login as super', shared.loginFn(config.superUser));

    it('translate profile survey 0 to spanish', translateSurveyFn(0, 'es'));

    it('logout as super', shared.logoutFn());

    it('get/verify translated profile survey 0 in spanish', verifyTranslatedProfileSurveyFn(0, 'es'));

    it('login as super', shared.loginFn(config.superUser));

    it('create profile survey 1', createProfileSurveyFn());

    it('logout as super', shared.logoutFn());

    it('get/verify profile survey 1 id', verifyProfileSurveyIdFn(1));

    it('get/verify profile survey 1', verifyProfileSurveyFn(1));

    it('get profile survey 1 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(1, 'es'));

    it('login as super', shared.loginFn(config.superUser));

    it('translate profile survey 1 to spanish', translateSurveyFn(1, 'es'));

    it('logout as super', shared.logoutFn());

    it('get/verify translated profile survey 1 in spanish', verifyTranslatedProfileSurveyFn(1, 'es'));

    it('login as super', shared.loginFn(config.superUser));

    it('create profile survey 2', createProfileSurveyFn());

    it('logout as super', shared.logoutFn());

    it('get/verify profile survey 2 id', verifyProfileSurveyIdFn(2));

    it('get/verify profile survey 2', verifyProfileSurveyFn(2));

    it('delete profile survey', deleteProfileSurveyId);

    it('verify empty profile survey', emptyProfileSurvey);

    it('verify empty profile survey id', emptyProfileSurveyId);

    it('login as super', shared.loginFn(config.superUser));

    it('create profile survey 3', createProfileSurveyFn());

    it('logout as super', shared.logoutFn());

    it('get/verify profile survey 3', verifyProfileSurveyFn(3));

    it('get/verify profile survey 3 id', verifyProfileSurveyIdFn(3));

    it('login as super', shared.loginFn(config.superUser));

    it('delete survey 3', (done) => {
        const id = hxSurvey.id(3);
        rrSuperTest.delete(`/surveys/${id}`, 204)
            .end(done);
    });

    it('logout as super', shared.logoutFn());

    it('verify empty profile survey', emptyProfileSurvey);

    it('verify empty profile survey id', emptyProfileSurveyId);

    it('login as super', shared.loginFn(config.superUser));

    it('create profile survey 4', createProfileSurveyFn());

    it('logout as super', shared.logoutFn());

    it('get/verify profile survey 4', verifyProfileSurveyFn(4));

    it('get/verify profile survey 4 id', verifyProfileSurveyIdFn(4));

    it('login as super', shared.loginFn(config.superUser));

    it('replace survey 4', (done) => {
        const id = hxSurvey.id(4);
        const replacementSurvey = generator.newSurvey();
        replacementSurvey.parentId = id;
        rrSuperTest.post('/surveys', replacementSurvey, 201)
            .expect((res) => {
                delete replacementSurvey.parentId;
                hxSurvey.push(replacementSurvey, res.body);
            })
            .end(done);
    });

    it('logout as super', shared.logoutFn());

    it('get/verify profile survey 5 (replaced 4)', verifyProfileSurveyFn(5));

    it('get/verify profile survey 5 (replaced 4) id', verifyProfileSurveyIdFn(5));

    shared.verifyUserAudit();
});
