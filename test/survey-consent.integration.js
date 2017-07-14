/* global describe,before,it,xit*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const config = require('../config');
const Generator = require('./util/generator');
const History = require('./util/history');
const ConsentCommon = require('./util/consent-common');
const ConsentDocumentHistory = require('./util/consent-document-history');
const SurveyHistory = require('./util/survey-history');
const MultiIndexHistory = require('./util/multi-index-history');
const comparator = require('./util/comparator');
const surveyCommon = require('./util/survey-common');
const answerCommon = require('./util/answer-common');

const expect = chai.expect;

describe('survey consent integration', () => {
    const userCount = 4;

    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxConsentDocument = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();
    const consentCommon = new ConsentCommon(hxConsent, hxConsentDocument, generator);
    const hxSurvey = new SurveyHistory();
    const hxUser = hxConsentDocument.hxUser;
    const hxSurveyConsents = new MultiIndexHistory();

    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const opt = { generator, hxUser, hxSurvey };
    const answerTests = new answerCommon.IntegrationTests(rrSuperTest, opt);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(10).forEach((i) => {
        it(`create consent type ${i}`, shared.createConsentTypeFn(hxConsentDocument));
    });

    [
        [4, 5, 6],
        [7, 8, 9],
    ].forEach((typeIndices, index) => {
        it(`create consent ${index}`, shared.createConsentFn(hxConsent, hxConsentDocument, typeIndices));
        it(`get/verify consent ${index}`, shared.verifyConsentFn(hxConsent, index));
    });

    it('create profile survey (survey 0)', shared.createProfileSurveyFn(hxSurvey));
    it('verify profile survey (survey 0)', shared.verifyProfileSurveyFn(hxSurvey, 0));

    _.range(1, 7).forEach((i) => {
        it(`create survey ${i}`, surveyTests.createSurveyFn(({ noSection: true })));
        it(`get survey ${i}`, surveyTests.getSurveyFn(i));
    });

    xit('error: get profile survey with no consent documents of existing types', (done) => {
        rrSuperTest.get('/profile-survey', false, 400)
            .expect(res => shared.verifyErrorMessage(res, 'noSystemConsentDocuments'))
            .end(done);
    });

    _.range(10).forEach((i) => {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(hxConsentDocument, i));
    });

    const surveysPerConsentType = _.range(10).map(() => []);

    const createSurveyConsentFn = function (surveyIndex, typeIndex, action, consentIndex) {
        return function createSurveyConsent(done) {
            const consentType = hxConsentDocument.type(typeIndex);
            const consentTypeId = consentType.id;
            const surveyId = hxSurvey.id(surveyIndex);
            const surveyConsent = { surveyId, consentTypeId, action };
            if (consentIndex !== undefined) {
                const consentId = hxConsent.id(consentIndex);
                surveyConsent.consentId = consentId;
            }
            rrSuperTest.post('/survey-consents', surveyConsent, 201)
                .expect((res) => {
                    const id = res.body.id;
                    surveyConsent.consentTypeName = consentType.name;
                    surveyConsent.consentTypeTitle = consentType.title;
                    if (consentIndex === undefined) {
                        hxSurveyConsents.pushWithId([surveyIndex, typeIndex, action], surveyConsent, id);
                    } else {
                        surveyConsent.consentName = hxConsent.client(consentIndex).name;
                        hxSurveyConsents.pushWithId([surveyIndex, typeIndex, action, consentIndex], surveyConsent, id);
                    }
                    if (surveysPerConsentType[typeIndex].find(r => (r === surveyIndex)) === undefined) {
                        surveysPerConsentType[typeIndex].push(surveyIndex);
                    }
                })
                .end(done);
        };
    };

    const updateSurveyServerForConsentTypeFn = function (surveyIndex, typeIndices) {
        return function updateSurveyServerForConsentType() {
            const survey = hxSurvey.server(surveyIndex);
            survey.consentTypeIds = typeIndices.map((index) => {
                const consentType = hxConsentDocument.type(index);
                return consentType.id;
            });
        };
    };

    const listConsentDocumentsFn = function () {
        return function listConsentDocuments() {
            return rrSuperTest.get('/consent-documents', false, 200)
                .then((res) => {
                    const types = _.range(10);
                    const expected = hxConsentDocument.serversInList(types, true);
                    comparator.consentDocuments(expected, res.body);
                });
        };
    };

    const listConsentDocumentsSurveyFn = function () {
        return function listConsentDocumentsSurvey() {
            return rrSuperTest.get('/consent-documents', false, 200, { surveys: true })
                .then((res) => {
                    const types = _.range(10);
                    const expected = _.cloneDeep(hxConsentDocument.serversInList(types, true));
                    expected.forEach((r, typeIndex) => {
                        const surveyIndices = surveysPerConsentType[typeIndex];
                        if (surveyIndices.length) {
                            r.surveys = surveyIndices.map((surveyIndex) => {
                                const { id, name } = hxSurvey.server(surveyIndex);
                                return { id, name };
                            });
                        }
                    });
                    comparator.consentDocuments(expected, res.body);
                });
        };
    };

    it('list consent documents', listConsentDocumentsFn());

    it('list consent documents with surveys', listConsentDocumentsSurveyFn());

    [0, 1].forEach((index) => {
        it(`require consent type ${index} in profile survey answer create`, createSurveyConsentFn(0, index, 'create'));
        it(`require consent type ${index} in profile survey answer read`, createSurveyConsentFn(0, index, 'read'));
    });

    [1, 2, 3].forEach((index) => {
        it(`require consent type ${index} in survey 1 answer create`, createSurveyConsentFn(1, index, 'create'));
        it(`require consent type ${index} in survey 1 answer read`, createSurveyConsentFn(1, index, 'read'));
    });

    [2, 3].forEach((index) => {
        it(`require consent type ${index} in survey 2 answer create`, createSurveyConsentFn(2, index, 'create'));
        it(`require consent type ${index} in survey 2 answer read`, createSurveyConsentFn(2, index, 'read'));
    });

    [0, 2].forEach((index) => {
        it(`require consent type ${index} in survey 3 answer create`, createSurveyConsentFn(3, index, 'create'));
    });

    [1, 3].forEach((index) => {
        it(`require consent type ${index} in survey 3 answer read`, createSurveyConsentFn(3, index, 'read'));
    });

    it('update consent type ids for survey 0', updateSurveyServerForConsentTypeFn(0, [0, 1]));
    it('update consent type ids for survey 1', updateSurveyServerForConsentTypeFn(1, [1, 2, 3]));
    it('update consent type ids for survey 2', updateSurveyServerForConsentTypeFn(2, [2, 3]));
    it('update consent type ids for survey 3', updateSurveyServerForConsentTypeFn(3, [0, 1, 2, 3]));

    _.range(7).forEach((index) => {
        it(`verify survey ${index}`, surveyTests.verifySurveyFn(index));
    });

    it('verify list surveys', surveyTests.listSurveysFn());

    it('list consent documents', listConsentDocumentsFn());

    it('list consent documents with surveys', listConsentDocumentsSurveyFn());

    it('error: require consent type with inconsistent consent', (done) => {
        const consentTypeId = hxConsentDocument.typeId(0);
        const surveyId = hxSurvey.id(5);
        const consentId = hxConsent.id(0);
        const surveyConsent = { surveyId, consentId, consentTypeId, action: 'read' };
        rrSuperTest.post('/survey-consents', surveyConsent, 400)
            .expect(res => shared.verifyErrorMessage(res, 'surveyConsentInvalidTypeForConsent'))
            .end(done);
    });

    [4, 5, 6].forEach((index) => {
        it(`require consent type ${index} (consent 0) in survey 4 answer create`, createSurveyConsentFn(4, index, 'create', 0));
    });
    [7, 8, 9].forEach((index) => {
        it(`require consent type ${index} (consent 1) in survey 4 answer read`, createSurveyConsentFn(4, index, 'read', 1));
    });

    [4, 5, 6].forEach((index) => {
        it(`require consent type ${index} (consent 0) in survey 5 answer create`, createSurveyConsentFn(5, index, 'create', 0));
        it(`require consent type ${index} (consent 0) in survey 5 answer read`, createSurveyConsentFn(5, index, 'read', 0));
    });
    [7, 8, 9].forEach((index) => {
        it(`require consent type ${index} (consent 1) in survey 5 answer create`, createSurveyConsentFn(5, index, 'create', 1));
        it(`require consent type ${index} (consent 1) in survey 5 answer read`, createSurveyConsentFn(5, index, 'read', 1));
    });

    it('verify survey consents list', (done) => {
        rrSuperTest.get('/survey-consents', true, 200)
            .expect((res) => {
                const list = hxSurveyConsents.listServers();
                expect(res.body).to.deep.equal(list);
            })
            .end(done);
    });

    it('get profile survey with required consentDocuments', (done) => {
        rrSuperTest.get('/profile-survey', false, 200)
            .expect((res) => {
                const result = res.body;
                expect(result.exists).to.equal(true);
                const actual = result.survey;
                const id = hxSurvey.id(0);
                expect(actual.id).to.equal(id);
                const expected = hxConsentDocument.serversInList([0, 1]);
                comparator.consentDocuments(expected, actual.consentDocuments);
            })
            .end(done);
    });

    const verifyConsentDocumentContentFn = function (typeIndex) {
        return function verifyConsentDocumentContent(done) {
            const id = hxConsentDocument.id(typeIndex);
            rrSuperTest.get(`/consent-documents/${id}`, false, 200)
                .expect((res) => {
                    const expected = hxConsentDocument.server(typeIndex);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    _.range(10).forEach((i) => {
        it(`get/verify consent section of type ${i}`, verifyConsentDocumentContentFn(i));
    });

    it('logout as super', shared.logoutFn());

    const createProfileWithoutSignaturesFn = function (index, signIndices, documentIndices) {
        return function createProfileWithoutSignatures(done) {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            const response = {
                user: generator.newUser(),
                answers,
            };
            if (signIndices) {
                const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
                Object.assign(response, { signatures });
            }
            rrSuperTest.authPost('/profiles', response, 400)
                .expect((res) => {
                    shared.verifyErrorMessage(res, 'profileSignaturesMissing');
                    const expected = hxConsentDocument.serversInList(documentIndices);
                    comparator.consentDocuments(expected, res.body.consentDocuments);
                })
                .end(done);
        };
    };

    const createProfileFn = function (index, signIndices) {
        return function createProfile(done) {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            const user = generator.newUser();
            const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
            const response = { user, answers, signatures };
            rrSuperTest.authPost('/profiles', response, 201)
                .expect((res) => {
                    hxUser.push(response.user, res.body);
                })
                .end(done);
        };
    };

    const getProfileFn = function (index) {
        return function getProfile(done) {
            rrSuperTest.get('/profiles', true, 200)
                .expect((res) => {
                    const result = res.body;
                    const clientUser = Object.assign({ role: 'participant' }, hxUser.client(index));
                    comparator.user(clientUser, result.user);
                    hxUser.updateServer(index, result.user);
                })
                .end(done);
        };
    };

    const verifyProfileFn = function (index) {
        return function verifyProfile(done) {
            rrSuperTest.get('/profiles', true, 200)
                .expect((res) => {
                    expect(res.body.user).to.deep.equal(hxUser.server(index));
                })
                .end(done);
        };
    };

    const readProfileWithoutSignaturesFn = function (index, documentIndices) {
        return function readProfileWithoutSignature(done) {
            rrSuperTest.get('/profiles', true, 400)
                .expect((res) => {
                    shared.verifyErrorMessage(res, 'profileSignaturesMissing');
                    const expected = hxConsentDocument.serversInList(documentIndices);
                    comparator.consentDocuments(expected, res.body.consentDocuments);
                })
                .end(done);
        };
    };

    _.range(userCount).forEach((i) => {
        it(`create user profile ${i} without signatures 0`, createProfileWithoutSignaturesFn(i, null, [0, 1]));
        it(`create user profile ${i} without signatures 1`, createProfileWithoutSignaturesFn(i, [], [0, 1]));
        it(`create user profile ${i} without signatures 2`, createProfileWithoutSignaturesFn(i, [0], [1]));
        it(`create user profile ${i} without signatures 3`, createProfileWithoutSignaturesFn(i, [1], [0]));
        it(`create user profile ${i} with signatures`, createProfileFn(i, [0, 1]));
        it(`read user profile ${i} with signatures`, getProfileFn(i));
        it(`logout as user ${i}`, shared.logoutFn());
    });

    it('login as super', shared.loginFn(config.superUser));
    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(hxConsentDocument, i));
    });
    it('logout as super', shared.logoutFn());

    _.range(userCount).forEach((i) => {
        it(`login as user ${i}`, shared.loginIndexFn(hxUser, i));
        it(`read user profile ${i} without signatures`, readProfileWithoutSignaturesFn(i, [0, 1]));
        it(`logout as user ${i}`, shared.logoutFn());
    });

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 0, 0));
    it('user 0 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 0, 1));
    it('logout as user 0', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 2, 0));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 3, 1));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('read user profile 0 with signatures', verifyProfileFn(0));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: read user profile 1 without signatures', readProfileWithoutSignaturesFn(1, [0, 1]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: read user profile 2 without signatures', readProfileWithoutSignaturesFn(2, [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: read user profile 3 without signatures', readProfileWithoutSignaturesFn(3, [0]));
    it('logout as user 3', shared.logoutFn());

    const answerSurveyWithoutSignaturesFn = function (userIndex, surveyIndex, expectedInfo) {
        return function answerSurveyWithoutSignatures(done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                surveyId: survey.id,
                answers,
            };
            rrSuperTest.post('/answers', input, 400)
                .expect((res) => {
                    shared.verifyErrorMessage(res, 'profileSignaturesMissing');
                    const expected = consentCommon.getSurveyConsentDocuments(expectedInfo);
                    comparator.consentDocuments(expected, res.body.consentDocuments);
                })
                .end(done);
        };
    };

    const listConsentSurveyDocumentsFn = function (userIndex, surveyIndex, action, expectedInfo, detail) {
        return function listConsentSurveyDocuments(done) {
            const surveyId = hxSurvey.id(surveyIndex);
            const query = { 'survey-id': surveyId, action };
            if (detail) {
                query.detail = true;
            }
            rrSuperTest.get('/survey-consent-documents', true, 200, query)
                .expect((res) => {
                    const expected = _.cloneDeep(consentCommon.getSurveyConsentDocuments(expectedInfo));
                    if (detail) {
                        const ids = expected.map(({ id }) => id);
                        const contents = hxConsentDocument.getContents(ids);
                        expected.forEach((r, index) => { r.content = contents[index]; });
                    }
                    comparator.consentDocuments(expected, res.body);
                })
                .end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 1 consent documents for create', listConsentSurveyDocumentsFn(0, 1, 'create', [2, 3]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 1 consent documents for create', listConsentSurveyDocumentsFn(1, 1, 'create', [1, 2, 3]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2, 3]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 1 consent documents for create (with content)', listConsentSurveyDocumentsFn(0, 1, 'create', [2, 3], true));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 1 consent documents for create (with content)', listConsentSurveyDocumentsFn(1, 1, 'create', [1, 2, 3], true));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 1 consent documents for create (with content)', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2, 3], true));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 1 consent documents for create (with content)', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3], true));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 2 consent documents for create', listConsentSurveyDocumentsFn(0, 2, 'create', [2, 3]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 2 consent documents for create', listConsentSurveyDocumentsFn(1, 2, 'create', [2, 3]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 2 consent documents for create', listConsentSurveyDocumentsFn(2, 2, 'create', [2, 3]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 3 consent documents for create', listConsentSurveyDocumentsFn(0, 3, 'create', [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 3 consent documents for create', listConsentSurveyDocumentsFn(1, 3, 'create', [0, 2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 3 consent documents for create', listConsentSurveyDocumentsFn(2, 3, 'create', [2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 3 consent documents for create', listConsentSurveyDocumentsFn(3, 3, 'create', [0, 2]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2, 3]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [1, 2, 3]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2, 3]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2, 3]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2, 3]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2, 3]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 0, 3));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 1, 1));
    it('user 1 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 1, 3));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 2, 3));
    it('logout as user 2', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 1 consent documents for create', listConsentSurveyDocumentsFn(0, 1, 'create', [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 1 consent documents for create', listConsentSurveyDocumentsFn(1, 1, 'create', [2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 2 consent documents for create', listConsentSurveyDocumentsFn(0, 2, 'create', [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 2 consent documents for create', listConsentSurveyDocumentsFn(1, 2, 'create', [2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 2 consent documents for create', listConsentSurveyDocumentsFn(2, 2, 'create', [2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 3 consent documents for create', listConsentSurveyDocumentsFn(0, 3, 'create', [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 3 consent documents for create', listConsentSurveyDocumentsFn(1, 3, 'create', [0, 2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 3 consent documents for create', listConsentSurveyDocumentsFn(2, 3, 'create', [2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 3 consent documents for create', listConsentSurveyDocumentsFn(3, 3, 'create', [0, 2]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));
    it('logout as user 3', shared.logoutFn());

    _.range(4).forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(hxUser, index));
        it(`user ${index} signs consent document 2`, shared.signConsentTypeFn(hxConsentDocument, index, 2));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 1, 0));
    it('logout as user 1', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 3, 0));
    it('logout as user 3', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [3]));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [3]));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [3]));
    it('logout as user 3', shared.logoutFn());

    _.range(4).forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(hxUser, index));
        it(`user ${index} answers survey 3`, answerTests.answerSurveyFn(index, 3));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 1', answerTests.answerSurveyFn(0, 1));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 1', answerTests.answerSurveyFn(1, 1));
    it('logout as user 1', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 2', answerTests.answerSurveyFn(0, 2));
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 2', answerTests.answerSurveyFn(1, 2));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 answers survey 2', answerTests.answerSurveyFn(2, 2));
    it('logout as user 2', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 gets answered survey 1', answerTests.verifyAnsweredSurveyFn(0, 1));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 gets answered survey 1', answerTests.verifyAnsweredSurveyFn(1, 1));
    it('logout as user 1', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 gets answered survey 2', answerTests.verifyAnsweredSurveyFn(0, 2));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 gets answered survey 2', answerTests.verifyAnsweredSurveyFn(1, 2));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 gets answered survey 2', answerTests.verifyAnsweredSurveyFn(2, 2));
    it('logout as user 2', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 gets answered survey 3', answerTests.verifyAnsweredSurveyFn(0, 3));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 gets answered survey 3', answerTests.verifyAnsweredSurveyFn(1, 3));
    it('logout as user 1', shared.logoutFn());

    const getAnswersWithoutSignaturesFn = function (userIndex, surveyIndex, expectedInfo) {
        return function getAnswersWithoutSignatures(done) {
            const survey = hxSurvey.server(surveyIndex);
            rrSuperTest.get(`/answered-surveys/${survey.id}`, true, 400)
                .expect((res) => {
                    shared.verifyErrorMessage(res, 'profileSignaturesMissing');
                    const expected = consentCommon.getSurveyConsentDocuments(expectedInfo);
                    comparator.consentDocuments(expected, res.body.consentDocuments);
                })
                .end(done);
        };
    };

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 3 consent documents for read', listConsentSurveyDocumentsFn(2, 3, 'read', [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 3 consent documents for read', listConsentSurveyDocumentsFn(3, 3, 'read', [3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [3]));
    it('logout as user 3', shared.logoutFn());

    _.range(2).forEach((i) => {
        it('login as super', shared.loginFn(config.superUser));
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(hxConsentDocument, i));
        it('logout as super', shared.logoutFn());
    });

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 1 consent documents for read', listConsentSurveyDocumentsFn(0, 1, 'read', [1]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 1 consent documents for read', listConsentSurveyDocumentsFn(1, 1, 'read', [1]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 1 consent documents for read', listConsentSurveyDocumentsFn(2, 1, 'read', [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 1 consent documents for read', listConsentSurveyDocumentsFn(3, 1, 'read', [1, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 3 consent documents for read', listConsentSurveyDocumentsFn(0, 3, 'read', [1]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 3 consent documents for read', listConsentSurveyDocumentsFn(1, 3, 'read', [1]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 3 consent documents for read', listConsentSurveyDocumentsFn(2, 3, 'read', [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 3 consent documents for read', listConsentSurveyDocumentsFn(3, 3, 'read', [1, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: user 0 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(0, 1, [1]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: user 1 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(1, 1, [1]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: user 2 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(2, 1, [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [1, 3]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: user 0 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(0, 3, [1]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: user 1 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(1, 3, [1]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [1, 3]));
    it('logout as user 3', shared.logoutFn());

    const fnDelete = function (surveyIndex, typeIndex, action) {
        return function fn(done) {
            const id = hxSurveyConsents.id([surveyIndex, typeIndex, action]);
            rrSuperTest.delete(`/survey-consents/${id}`, 204).end(done);
        };
    };

    it('login as super', shared.loginFn(config.superUser));
    it('delete survey 1 consent type 1', fnDelete(1, 1, 'read'));
    it('logout as super', shared.logoutFn());

    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 1 consent documents for read', listConsentSurveyDocumentsFn(3, 1, 'read', [3]));

    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [3]));
    it('logout as user 3', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('delete survey 1 consent type 1', fnDelete(1, 1, 'create'));
    it('logout as super', shared.logoutFn());

    [0, 1, 2].forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(hxUser, index));
        it(`user ${index} answers survey 1`, answerTests.answerSurveyFn(index, 1));
        it(`user ${index} answered survey 1`, answerTests.verifyAnsweredSurveyFn(index, 1));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    _.range(4).forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(hxUser, index));
        it(`user ${index} survey 4 consent documents for create`, listConsentSurveyDocumentsFn(index, 4, 'create', [
            [0, 4],
            [0, 5],
            [0, 6],
        ]));
        it(`user ${index} survey 5 consent documents for create`, listConsentSurveyDocumentsFn(index, 5, 'create', [
            [0, 4],
            [0, 5],
            [0, 6],
            [1, 7],
            [1, 8],
            [1, 9],
        ]));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    _.range(4).forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(hxUser, index));
        it(`error: create user ${index} answers to survey 4 without signatures`, answerSurveyWithoutSignaturesFn(index, 4, [
            [0, 4],
            [0, 5],
            [0, 6],
        ]));
        it(`error: create user ${index} answers to survey 5 without signatures`, answerSurveyWithoutSignaturesFn(index, 5, [
            [0, 4],
            [0, 5],
            [0, 6],
            [1, 7],
            [1, 8],
            [1, 9],
        ]));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 bulk signs consent documents 4, 5, 6', shared.bulkSignConsentTypeFn(hxConsentDocument, 0, [4, 5, 6]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 bulk signs consent documents 4, 5, 6, 7, 8, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 1, [4, 5, 6, 7, 8, 9]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 bulk signs consent documents 4, 6, 8', shared.bulkSignConsentTypeFn(hxConsentDocument, 2, [4, 6, 8]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 bulk signs consent documents 5, 7, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 3, [5, 7, 9]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 4 consent documents for create', listConsentSurveyDocumentsFn(2, 4, 'create', [
        [0, 5],
    ]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 4 consent documents for create', listConsentSurveyDocumentsFn(3, 4, 'create', [
        [0, 4],
        [0, 6],
    ]));
    it('logout as user 3', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 5 consent documents for create', listConsentSurveyDocumentsFn(0, 5, 'create', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 5 consent documents for create', listConsentSurveyDocumentsFn(2, 5, 'create', [
        [0, 5],
        [1, 7],
        [1, 9],
    ]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 5 consent documents for create', listConsentSurveyDocumentsFn(3, 5, 'create', [
        [0, 4],
        [0, 6],
        [1, 8],
    ]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 4 without signatures', answerSurveyWithoutSignaturesFn(2, 4, [
        [0, 5],
    ]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 4 without signatures', answerSurveyWithoutSignaturesFn(3, 4, [
        [0, 4],
        [0, 6],
    ]));
    it('logout as user 3', shared.logoutFn());
    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: create user 0 answers to survey 5 without signatures', answerSurveyWithoutSignaturesFn(0, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: create user 2 answers to survey 5 without signatures', answerSurveyWithoutSignaturesFn(2, 5, [
        [0, 5],
        [1, 7],
        [1, 9],
    ]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: create user 3 answers to survey 5 without signatures', answerSurveyWithoutSignaturesFn(3, 5, [
        [0, 4],
        [0, 6],
        [1, 8],
    ]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 4', answerTests.answerSurveyFn(0, 4));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 4', answerTests.answerSurveyFn(1, 4));
    it('user 1 answers survey 5', answerTests.answerSurveyFn(1, 5));

    it('user 1 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(1, 4));
    it('user 1 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(1, 5));
    it('logout as user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 4 consent documents for read', listConsentSurveyDocumentsFn(0, 4, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));

    it('error: user 0 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(0, 4, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 0', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 bulk signs consent documents 7, 8, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 0, [7, 8, 9]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 bulk signs consent documents 5, 7, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 2, [5, 7, 9]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 bulk signs consent documents 4, 6, 8', shared.bulkSignConsentTypeFn(hxConsentDocument, 3, [4, 6, 8]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 5', answerTests.answerSurveyFn(0, 5));
    it('logout as user 0', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 answers survey 5', answerTests.answerSurveyFn(2, 4));
    it('user 2 answers survey 5', answerTests.answerSurveyFn(2, 5));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 answers survey 5', answerTests.answerSurveyFn(3, 4));
    it('user 3 answers survey 5', answerTests.answerSurveyFn(3, 5));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(0, 4));
    it('user 0 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(0, 5));
    it('logout as user 0', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(2, 4));
    it('user 2 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(2, 5));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(3, 4));
    it('user 3 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(3, 5));
    it('logout as user 3', shared.logoutFn());

    _.range(7, 10).forEach((i) => {
        it('login as super', shared.loginFn(config.superUser));
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(hxConsentDocument, i));
        it('logout as super', shared.logoutFn());
    });

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 survey 4 consent documents for read', listConsentSurveyDocumentsFn(0, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 survey 4 consent documents for read', listConsentSurveyDocumentsFn(1, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 survey 4 consent documents for read', listConsentSurveyDocumentsFn(2, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 survey 4 consent documents for read', listConsentSurveyDocumentsFn(3, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('error: user 0 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(0, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('error: user 1 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(1, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('error: user 2 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(2, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 2', shared.logoutFn());
    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('error: user 3 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(3, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('logout as user 3', shared.logoutFn());
});
