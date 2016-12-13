/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const RRError = require('../lib/rr-error');
const config = require('../config');
const Generator = require('./util/generator');
const History = require('./util/history');
const ConsentCommon = require('./util/consent-common');
const ConsentDocumentHistory = require('./util/consent-document-history');
const SurveyHistory = require('./util/survey-history');
const MultiIndexHistory = require('./util/multi-index-history');
const MultiIndexStore = require('./util/multi-index-store');
const comparator = require('./util/comparator');
const surveyCommon = require('./util/survey-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('survey consent integration', function () {
    const userCount = 4;

    const store = new RRSuperTest();
    const hxConsentDocument = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();
    const consentCommon = new ConsentCommon(hxConsent, hxConsentDocument, generator);
    const hxSurvey = new SurveyHistory();
    const hxUser = hxConsentDocument.hxUser;
    const hxSurveyConsents = new MultiIndexHistory();
    const hxAnswers = new MultiIndexStore();

    const surveyTests = new surveyCommon.IntegrationTests(store, generator, hxSurvey);

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 10; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(store, hxConsentDocument));
    }

    [
        [4, 5, 6],
        [7, 8, 9]
    ].forEach((typeIndices, index) => {
        it(`create consent ${index}`, shared.createConsentFn(store, hxConsent, hxConsentDocument, typeIndices));
        it(`get/verify consent ${index}`, shared.verifyConsentFn(store, hxConsent, index));
    });

    it('create profile survey (survey 0)', shared.createProfileSurveyFn(store, hxSurvey));
    it('verify profile survey (survey 0)', shared.verifyProfileSurveyFn(store, hxSurvey, 0));

    for (let i = 1; i < 7; ++i) {
        it(`create survey ${i}`, surveyTests.createSurveyFn());
        it(`get survey ${i}`, surveyTests.getSurveyFn(i));
    }

    const createSurveyConsentFn = function (surveyIndex, typeIndex, action, consentIndex) {
        return function (done) {
            const consentType = hxConsentDocument.type(typeIndex);
            const consentTypeId = consentType.id;
            const surveyId = hxSurvey.id(surveyIndex);
            const surveyConsent = { surveyId, consentTypeId, action };
            if (consentIndex !== undefined) {
                const consentId = hxConsent.id(consentIndex);
                surveyConsent.consentId = consentId;
            }
            store.post('/survey-consents', surveyConsent, 201)
                .expect(function (res) {
                    const id = res.body.id;
                    delete surveyConsent.surveyId;
                    surveyConsent.consentTypeName = consentType.name;
                    surveyConsent.consentTypeTitle = consentType.title;
                    if (consentIndex === undefined) {
                        hxSurveyConsents.pushWithId([surveyIndex, typeIndex, action], surveyConsent, id);
                    } else {
                        surveyConsent.consentName = hxConsent.client(consentIndex).name;
                        hxSurveyConsents.pushWithId([surveyIndex, typeIndex, action, consentIndex], surveyConsent, id);
                    }
                })
                .end(done);
        };
    };

    [0, 1].forEach(index => {
        it(`require consent type ${index} in profile survey answer create`, createSurveyConsentFn(0, index, 'create'));
        it(`require consent type ${index} in profile survey answer read`, createSurveyConsentFn(0, index, 'read'));
    });

    [1, 2, 3].forEach(index => {
        it(`require consent type ${index} in survey 1 answer create`, createSurveyConsentFn(1, index, 'create'));
        it(`require consent type ${index} in survey 1 answer read`, createSurveyConsentFn(1, index, 'read'));
    });

    [2, 3].forEach(index => {
        it(`require consent type ${index} in survey 2 answer create`, createSurveyConsentFn(2, index, 'create'));
        it(`require consent type ${index} in survey 2 answer read`, createSurveyConsentFn(2, index, 'read'));
    });

    [0, 2].forEach(index => {
        it(`require consent type ${index} in survey 3 answer create`, createSurveyConsentFn(3, index, 'create'));
    });

    [1, 3].forEach(index => {
        it(`require consent type ${index} in survey 3 answer read`, createSurveyConsentFn(3, index, 'read'));
    });

    it('error: require consent type with inconsistent consent', function (done) {
        const consentTypeId = hxConsentDocument.typeId(0);
        const surveyId = hxSurvey.id(5);
        const consentId = hxConsent.id(0);
        const surveyConsent = { surveyId, consentId, consentTypeId, action: 'read' };
        store.post('/survey-consents', surveyConsent, 400)
            .expect(function (res) {
                expect(res.body.message).to.equal(RRError.message('surveyConsentInvalidTypeForConsent'));
            })
            .end(done);
    });

    [4, 5, 6].forEach(index => {
        it(`require consent type ${index} (consent 0) in survey 4 answer create`, createSurveyConsentFn(4, index, 'create', 0));
    });
    [7, 8, 9].forEach(index => {
        it(`require consent type ${index} (consent 1) in survey 4 answer read`, createSurveyConsentFn(4, index, 'read', 1));
    });

    [4, 5, 6].forEach(index => {
        it(`require consent type ${index} (consent 0) in survey 5 answer create`, createSurveyConsentFn(5, index, 'create', 0));
        it(`require consent type ${index} (consent 0) in survey 5 answer read`, createSurveyConsentFn(5, index, 'read', 0));
    });
    [7, 8, 9].forEach(index => {
        it(`require consent type ${index} (consent 1) in survey 5 answer create`, createSurveyConsentFn(5, index, 'create', 1));
        it(`require consent type ${index} (consent 1) in survey 5 answer read`, createSurveyConsentFn(5, index, 'read', 1));
    });

    it('verify survey consents list', function (done) {
        store.get('/survey-consents', true, 200)
            .expect(function (res) {
                const list = hxSurveyConsents.listServers();
                expect(res.body).to.deep.equal(list);
            })
            .end(done);
    });

    it('error: get profile survey with no consent documents of existing types', function (done) {
        store.get('/profile-survey', false, 400)
            .expect(function (res) {
                expect(res.body.message).to.equal(RRError.message('noSystemConsentDocuments'));
            })
            .end(done);
    });

    for (let i = 0; i < 10; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(store, hxConsentDocument, i));
    }

    it('get profile survey with required consentDocuments', function (done) {
        store.get('/profile-survey', false, 200)
            .expect(function (res) {
                const result = res.body;
                expect(result.exists).to.equal(true);
                const actual = result.survey;
                const id = hxSurvey.id(0);
                expect(actual.id).to.equal(id);
                const expected = hxConsentDocument.serversInList([0, 1]);
                expect(actual.consentDocuments).to.deep.equal(expected);
            })
            .end(done);
    });

    const verifyConsentDocumentContentFn = function (typeIndex) {
        return function (done) {
            const id = hxConsentDocument.id(typeIndex);
            store.get(`/consent-documents/${id}`, false, 200)
                .expect(function (res) {
                    const expected = hxConsentDocument.server(typeIndex);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    for (let i = 0; i < 10; ++i) {
        it(`get/verify consent section of type ${i}`, verifyConsentDocumentContentFn(i));
    }

    it('logout as super', shared.logoutFn(store));

    const createProfileWithoutSignaturesFn = function (index, signIndices, documentIndices) {
        return function (done) {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            let response = {
                user: generator.newUser(),
                answers
            };
            if (signIndices) {
                const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
                Object.assign(response, { signatures });
            }
            store.authPost('/profiles', response, 400)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('profileSignaturesMissing'));
                    const expected = hxConsentDocument.serversInList(documentIndices);
                    expect(res.body.consentDocuments).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const createProfileFn = function (index, signIndices) {
        return function (done) {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            const user = generator.newUser();
            const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
            const response = { user, answers, signatures };
            store.authPost('/profiles', response, 201)
                .expect(function (res) {
                    hxUser.push(response.user, res.body);
                })
                .end(done);
        };
    };

    const getProfileFn = function (index) {
        return function (done) {
            store.get('/profiles', true, 200)
                .expect(function (res) {
                    const result = res.body;
                    const clientUser = Object.assign({ role: 'participant' }, hxUser.client(index));
                    comparator.user(clientUser, result.user);
                })
                .end(done);
        };
    };

    const readProfileWithoutSignaturesFn = function (index, documentIndices) {
        return function (done) {
            store.get('/profiles', true, 400)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('profileSignaturesMissing'));
                    const expected = hxConsentDocument.serversInList(documentIndices);
                    expect(res.body.consentDocuments).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    for (let i = 0; i < userCount; ++i) {
        it(`create user profile ${i} without signatures 0`, createProfileWithoutSignaturesFn(i, null, [0, 1]));
        it(`create user profile ${i} without signatures 1`, createProfileWithoutSignaturesFn(i, [], [0, 1]));
        it(`create user profile ${i} without signatures 2`, createProfileWithoutSignaturesFn(i, [0], [1]));
        it(`create user profile ${i} without signatures 3`, createProfileWithoutSignaturesFn(i, [1], [0]));
        it(`create user profile ${i} with signatures`, createProfileFn(i, [0, 1]));
        it(`read user profile ${i} with signatures`, getProfileFn(i));
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 0; i < 2; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(store, hxConsentDocument, i));
    }
    it('logout as super', shared.logoutFn(store));

    for (let i = 0; i < userCount; ++i) {
        it(`login as user ${i}`, shared.loginIndexFn(store, hxUser, i));
        it(`read user profile ${i} without signatures`, readProfileWithoutSignaturesFn(i, [0, 1]));
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 signs consent document 0', shared.signConsentTypeFn(store, hxConsentDocument, 0, 0));
    it('user 0 signs consent document 1', shared.signConsentTypeFn(store, hxConsentDocument, 0, 1));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 signs consent document 0', shared.signConsentTypeFn(store, hxConsentDocument, 2, 0));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 signs consent document 1', shared.signConsentTypeFn(store, hxConsentDocument, 3, 1));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it(`read user profile 0 with signatures`, getProfileFn(0));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: read user profile 1 without signatures', readProfileWithoutSignaturesFn(1, [0, 1]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: read user profile 2 without signatures', readProfileWithoutSignaturesFn(2, [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: read user profile 3 without signatures', readProfileWithoutSignaturesFn(3, [0]));
    it('logout as user 3', shared.logoutFn(store));

    const answerSurveyWithoutSignaturesFn = function (userIndex, surveyIndex, expectedInfo) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                surveyId: survey.id,
                answers
            };
            store.post('/answers', input, 400)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('profileSignaturesMissing'));
                    const expected = consentCommon.getSurveyConsentDocuments(expectedInfo);
                    expect(res.body.consentDocuments).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const listConsentSurveyDocumentsFn = function (userIndex, surveyIndex, action, expectedInfo) {
        return function (done) {
            const surveyId = hxSurvey.id(surveyIndex);
            store.get('/survey-consent-documents', true, 200, { 'survey-id': surveyId, action })
                .expect(function (res) {
                    const expected = consentCommon.getSurveyConsentDocuments(expectedInfo);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 1 consent documents for create', listConsentSurveyDocumentsFn(0, 1, 'create', [2, 3]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 1 consent documents for create', listConsentSurveyDocumentsFn(1, 1, 'create', [1, 2, 3]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2, 3]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 2 consent documents for create', listConsentSurveyDocumentsFn(0, 2, 'create', [2, 3]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 2 consent documents for create', listConsentSurveyDocumentsFn(1, 2, 'create', [2, 3]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 2 consent documents for create', listConsentSurveyDocumentsFn(2, 2, 'create', [2, 3]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 3 consent documents for create', listConsentSurveyDocumentsFn(0, 3, 'create', [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 3 consent documents for create', listConsentSurveyDocumentsFn(1, 3, 'create', [0, 2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 3 consent documents for create', listConsentSurveyDocumentsFn(2, 3, 'create', [2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 3 consent documents for create', listConsentSurveyDocumentsFn(3, 3, 'create', [0, 2]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2, 3]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [1, 2, 3]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2, 3]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2, 3]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2, 3]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2, 3]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 signs consent document 3', shared.signConsentTypeFn(store, hxConsentDocument, 0, 3));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 signs consent document 1', shared.signConsentTypeFn(store, hxConsentDocument, 1, 1));
    it('user 1 signs consent document 3', shared.signConsentTypeFn(store, hxConsentDocument, 1, 3));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 signs consent document 3', shared.signConsentTypeFn(store, hxConsentDocument, 2, 3));
    it('logout as user 2', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 1 consent documents for create', listConsentSurveyDocumentsFn(0, 1, 'create', [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 1 consent documents for create', listConsentSurveyDocumentsFn(1, 1, 'create', [2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 2 consent documents for create', listConsentSurveyDocumentsFn(0, 2, 'create', [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 2 consent documents for create', listConsentSurveyDocumentsFn(1, 2, 'create', [2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 2 consent documents for create', listConsentSurveyDocumentsFn(2, 2, 'create', [2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 3 consent documents for create', listConsentSurveyDocumentsFn(0, 3, 'create', [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 3 consent documents for create', listConsentSurveyDocumentsFn(1, 3, 'create', [0, 2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 3 consent documents for create', listConsentSurveyDocumentsFn(2, 3, 'create', [2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 3 consent documents for create', listConsentSurveyDocumentsFn(3, 3, 'create', [0, 2]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));
    it('logout as user 3', shared.logoutFn(store));

    _.range(4).forEach(index => {
        it(`login as user ${index}`, shared.loginIndexFn(store, hxUser, index));
        it(`user ${index} signs consent document 2`, shared.signConsentTypeFn(store, hxConsentDocument, index, 2));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 signs consent document 0', shared.signConsentTypeFn(store, hxConsentDocument, 1, 0));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 signs consent document 0', shared.signConsentTypeFn(store, hxConsentDocument, 3, 0));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [3]));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [3]));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [3]));
    it('logout as user 3', shared.logoutFn(store));

    const answerSurveyFn = function (userIndex, surveyIndex) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = { surveyId: survey.id, answers };
            store.post('/answers', input, 204)
                .expect(function () {
                    hxAnswers.push(userIndex, surveyIndex, answers);
                })
                .end(done);
        };
    };

    const verifyAnsweredSurveyFn = function (userIndex, surveyIndex) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = hxAnswers.getLast(userIndex, surveyIndex);
            store.get(`/answered-surveys/${survey.id}`, true, 200)
                .expect(function (res) {
                    comparator.answeredSurvey(survey, answers, res.body);
                })
                .end(done);
        };
    };

    _.range(4).forEach(index => {
        it(`login as user ${index}`, shared.loginIndexFn(store, hxUser, index));
        it(`user ${index} answers survey 3`, answerSurveyFn(index, 3));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 answers survey 1', answerSurveyFn(0, 1));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 answers survey 1', answerSurveyFn(1, 1));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 answers survey 2', answerSurveyFn(0, 2));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 answers survey 2', answerSurveyFn(1, 2));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 answers survey 2', answerSurveyFn(2, 2));
    it('logout as user 2', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 gets answered survey 1', verifyAnsweredSurveyFn(0, 1));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 gets answered survey 1', verifyAnsweredSurveyFn(1, 1));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 gets answered survey 2', verifyAnsweredSurveyFn(0, 2));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 gets answered survey 2', verifyAnsweredSurveyFn(1, 2));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 gets answered survey 2', verifyAnsweredSurveyFn(2, 2));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 gets answered survey 3', verifyAnsweredSurveyFn(0, 3));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 gets answered survey 3', verifyAnsweredSurveyFn(1, 3));
    it('logout as user 1', shared.logoutFn(store));

    const getAnswersWithoutSignaturesFn = function (userIndex, surveyIndex, expectedInfo) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            store.get(`/answered-surveys/${survey.id}`, true, 400)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('profileSignaturesMissing'));
                    const expected = consentCommon.getSurveyConsentDocuments(expectedInfo);
                    expect(res.body.consentDocuments).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 3 consent documents for read', listConsentSurveyDocumentsFn(2, 3, 'read', [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 3 consent documents for read', listConsentSurveyDocumentsFn(3, 3, 'read', [3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [3]));
    it('logout as user 3', shared.logoutFn(store));

    for (let i = 0; i < 2; ++i) {
        it('login as super', shared.loginFn(store, config.superUser));
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(store, hxConsentDocument, i));
        it('logout as super', shared.logoutFn(store));
    }

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 1 consent documents for read', listConsentSurveyDocumentsFn(0, 1, 'read', [1]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 1 consent documents for read', listConsentSurveyDocumentsFn(1, 1, 'read', [1]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 1 consent documents for read', listConsentSurveyDocumentsFn(2, 1, 'read', [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 1 consent documents for read', listConsentSurveyDocumentsFn(3, 1, 'read', [1, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 3 consent documents for read', listConsentSurveyDocumentsFn(0, 3, 'read', [1]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 3 consent documents for read', listConsentSurveyDocumentsFn(1, 3, 'read', [1]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 3 consent documents for read', listConsentSurveyDocumentsFn(2, 3, 'read', [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 3 consent documents for read', listConsentSurveyDocumentsFn(3, 3, 'read', [1, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: user 0 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(0, 1, [1]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: user 1 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(1, 1, [1]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: user 2 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(2, 1, [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [1, 3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: user 0 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(0, 3, [1]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: user 1 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(1, 3, [1]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [1, 3]));
    it('logout as user 3', shared.logoutFn(store));

    const fnDelete = function (surveyIndex, typeIndex, action) {
        return function (done) {
            const id = hxSurveyConsents.id([surveyIndex, typeIndex, action]);
            store.delete(`/survey-consents/${id}`, 204).end(done);
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    it(`delete survey 1 consent type 1`, fnDelete(1, 1, 'read'));
    it('logout as super', shared.logoutFn(store));

    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 1 consent documents for read', listConsentSurveyDocumentsFn(3, 1, 'read', [3]));

    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [3]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it(`delete survey 1 consent type 1`, fnDelete(1, 1, 'create'));
    it('logout as super', shared.logoutFn(store));

    [0, 1, 2].forEach(index => {
        it(`login as user ${index}`, shared.loginIndexFn(store, hxUser, index));
        it(`user ${index} answers survey 1`, answerSurveyFn(index, 1));
        it(`user ${index} answered survey 1`, verifyAnsweredSurveyFn(index, 1));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    _.range(4).forEach(index => {
        it(`login as user ${index}`, shared.loginIndexFn(store, hxUser, index));
        it(`user ${index} survey 4 consent documents for create`, listConsentSurveyDocumentsFn(index, 4, 'create', [
            [0, 4],
            [0, 5],
            [0, 6]
        ]));
        it(`user ${index} survey 5 consent documents for create`, listConsentSurveyDocumentsFn(index, 5, 'create', [
            [0, 4],
            [0, 5],
            [0, 6],
            [1, 7],
            [1, 8],
            [1, 9]
        ]));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    _.range(4).forEach(index => {
        it(`login as user ${index}`, shared.loginIndexFn(store, hxUser, index));
        it(`error: create user ${index} answers to survey 4 without signatures`, answerSurveyWithoutSignaturesFn(index, 4, [
            [0, 4],
            [0, 5],
            [0, 6]
        ]));
        it(`error: create user ${index} answers to survey 5 without signatures`, answerSurveyWithoutSignaturesFn(index, 5, [
            [0, 4],
            [0, 5],
            [0, 6],
            [1, 7],
            [1, 8],
            [1, 9]
        ]));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 bulk signs consent documents 4, 5, 6', shared.bulkSignConsentTypeFn(store, hxConsentDocument, 0, [4, 5, 6]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 bulk signs consent documents 4, 5, 6, 7, 8, 9', shared.bulkSignConsentTypeFn(store, hxConsentDocument, 1, [4, 5, 6, 7, 8, 9]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 bulk signs consent documents 4, 6, 8', shared.bulkSignConsentTypeFn(store, hxConsentDocument, 2, [4, 6, 8]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 bulk signs consent documents 5, 7, 9', shared.bulkSignConsentTypeFn(store, hxConsentDocument, 3, [5, 7, 9]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it(`user 2 survey 4 consent documents for create`, listConsentSurveyDocumentsFn(2, 4, 'create', [
        [0, 5]
    ]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`user 3 survey 4 consent documents for create`, listConsentSurveyDocumentsFn(3, 4, 'create', [
        [0, 4],
        [0, 6]
    ]));
    it('logout as user 3', shared.logoutFn(store));
    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it(`user 0 survey 5 consent documents for create`, listConsentSurveyDocumentsFn(0, 5, 'create', [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it(`user 2 survey 5 consent documents for create`, listConsentSurveyDocumentsFn(2, 5, 'create', [
        [0, 5],
        [1, 7],
        [1, 9]
    ]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`user 3 survey 5 consent documents for create`, listConsentSurveyDocumentsFn(3, 5, 'create', [
        [0, 4],
        [0, 6],
        [1, 8]
    ]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it(`error: create user 2 answers to survey 4 without signatures`, answerSurveyWithoutSignaturesFn(2, 4, [
        [0, 5]
    ]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`error: create user 3 answers to survey 4 without signatures`, answerSurveyWithoutSignaturesFn(3, 4, [
        [0, 4],
        [0, 6]
    ]));
    it('logout as user 3', shared.logoutFn(store));
    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it(`error: create user 0 answers to survey 5 without signatures`, answerSurveyWithoutSignaturesFn(0, 5, [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it(`error: create user 2 answers to survey 5 without signatures`, answerSurveyWithoutSignaturesFn(2, 5, [
        [0, 5],
        [1, 7],
        [1, 9]
    ]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`error: create user 3 answers to survey 5 without signatures`, answerSurveyWithoutSignaturesFn(3, 5, [
        [0, 4],
        [0, 6],
        [1, 8]
    ]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 answers survey 4', answerSurveyFn(0, 4));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 answers survey 4', answerSurveyFn(1, 4));
    it('user 1 answers survey 5', answerSurveyFn(1, 5));

    it('user 1 gets answered survey 4', verifyAnsweredSurveyFn(1, 4));
    it('user 1 gets answered survey 5', verifyAnsweredSurveyFn(1, 5));
    it('logout as user 1', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 4 consent documents for read', listConsentSurveyDocumentsFn(0, 4, 'read', [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));

    it('error: user 0 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(0, 4, [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 0', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 bulk signs consent documents 7, 8, 9', shared.bulkSignConsentTypeFn(store, hxConsentDocument, 0, [7, 8, 9]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 bulk signs consent documents 5, 7, 9', shared.bulkSignConsentTypeFn(store, hxConsentDocument, 2, [5, 7, 9]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 bulk signs consent documents 4, 6, 8', shared.bulkSignConsentTypeFn(store, hxConsentDocument, 3, [4, 6, 8]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 answers survey 5', answerSurveyFn(0, 5));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 answers survey 5', answerSurveyFn(2, 4));
    it('user 2 answers survey 5', answerSurveyFn(2, 5));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 answers survey 5', answerSurveyFn(3, 4));
    it('user 3 answers survey 5', answerSurveyFn(3, 5));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 gets answered survey 4', verifyAnsweredSurveyFn(0, 4));
    it('user 0 gets answered survey 5', verifyAnsweredSurveyFn(0, 5));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 gets answered survey 4', verifyAnsweredSurveyFn(2, 4));
    it('user 2 gets answered survey 5', verifyAnsweredSurveyFn(2, 5));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 gets answered survey 4', verifyAnsweredSurveyFn(3, 4));
    it('user 3 gets answered survey 5', verifyAnsweredSurveyFn(3, 5));
    it('logout as user 3', shared.logoutFn(store));

    for (let i = 7; i < 10; ++i) {
        it('login as super', shared.loginFn(store, config.superUser));
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(store, hxConsentDocument, i));
        it('logout as super', shared.logoutFn(store));
    }

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 survey 4 consent documents for read', listConsentSurveyDocumentsFn(0, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 survey 4 consent documents for read', listConsentSurveyDocumentsFn(1, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('user 2 survey 4 consent documents for read', listConsentSurveyDocumentsFn(2, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('user 3 survey 4 consent documents for read', listConsentSurveyDocumentsFn(3, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 3', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('error: user 0 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(0, 5, [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('error: user 1 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(1, 5, [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 1', shared.logoutFn(store));
    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it('error: user 2 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(2, 5, [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 2', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it('error: user 3 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(3, 5, [
        [1, 7],
        [1, 8],
        [1, 9]
    ]));
    it('logout as user 3', shared.logoutFn(store));
});
