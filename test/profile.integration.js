/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');

const expect = chai.expect;

describe('profile integration', () => {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);

    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);
    const typeTests = new consentTypeCommon.IntegrationTests(rrSuperTest, {
        generator, hxConsentType: hxConsentDoc.hxType,
    });
    const docTests = new consentDocumentCommon.SpecTests({
        generator, hxConsentDocument: hxConsentDoc,
    });

    before(shared.setUpFn());

    const createProfileFn = function () {
        return function createProfile(done) {
            const user = generator.newUser();
            const input = { user };
            rrSuperTest.authPost('/profiles', input, 201)
                .expect(() => {
                    hxUser.push(user, {});
                    hxAnswers.push(null);
                })
                .end(done);
        };
    };

    const verifyProfileFn = function (userIndex) {
        return function verifyProfile(done) {
            rrSuperTest.get('/profiles', true, 200)
                .expect((res) => {
                    const result = res.body;
                    comparator.user(hxUser.client(userIndex), result.user);
                })
                .end(done);
        };
    };

    const updateProfileFn = function (userIndex) {
        return function updateProfile(done) {
            const userUpdates = {
                email: `updated${userIndex}@example.com`,
            };
            hxUser.client(userIndex).email = userUpdates.email;
            const updateObj = {
                user: userUpdates,
            };
            rrSuperTest.patch('/profiles', updateObj, 204)
                .end(done);
        };
    };

    _.range(0, 2).forEach((index) => {
        it(`register user ${index} with profile`, createProfileFn());
        it(`verify user ${index} profile`, verifyProfileFn(index));
        it(`update user ${index} profile`, updateProfileFn(index));
        it(`verify user ${index} profile`, verifyProfileFn(index));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('login as super', shared.loginFn(config.superUser));
    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, typeTests.createConsentTypeFn());
    });
    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, docTests.createConsentDocumentFn(i));
    });
    it('create profile survey', shared.createProfileSurveyFn(hxSurvey));
    it('logout as super', shared.logoutFn());

    it('get/verify profile survey', shared.verifyProfileSurveyFn(hxSurvey, 0));

    const createProfileWithSurveyFn = function (surveyIndex, signatures) {
        return function createProfileWithSurvey(done) {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            rrSuperTest.authPost('/profiles', input, 201)
                .expect(() => {
                    hxUser.push(clientUser, {});
                })
                .end(done);
        };
    };

    const createProfileWithSurveyLanguageFn = function (surveyIndex, signatures, language) {
        return function createProfileWithSurveyLanguage(done) {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            if (language) {
                input.language = language;
            }
            rrSuperTest.authPost('/profiles', input, 201)
                .expect(() => {
                    hxUser.push(clientUser, {});
                })
                .end(done);
        };
    };

    const verifyProfileWithSurveyFn = function (surveyIndex, userIndex, language) {
        return function verifyProfileWithSurvey(done) {
            rrSuperTest.get('/profiles', true, 200)
                .expect((res) => {
                    const result = res.body;
                    const survey = hxSurvey.server(surveyIndex);

                    comparator.user(hxUser.client(userIndex), result.user);
                    comparator.answeredSurvey(survey, hxAnswers[userIndex], result.survey, language);
                })
                .end(done);
        };
    };

    const updateProfileWithSurveyFn = function (surveyIndex, userIndex) {
        return function updateProfileWithSurvey(done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const userUpdates = {
                email: `updated${userIndex}@example.com`,
            };
            hxUser.client(userIndex).email = userUpdates.email;
            const updateObj = {
                user: userUpdates,
                answers,
            };
            hxAnswers[userIndex] = answers;
            rrSuperTest.patch('/profiles', updateObj, 204).end(done);
        };
    };

    const verifySignedDocumentFn = function (expected, language) {
        return function verifySignedDocument(done) {
            const server = hxConsentDoc.server(0);
            rrSuperTest.get(`/user-consent-documents/${server.id}`, true, 200)
                .expect((res) => {
                    const result = res.body;
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal(language || 'en');
                    }
                })
                .end(done);
        };
    };

    const verifySignedDocumentByTypeIdFn = function (expected) {
        return function verifySignedDocumentByTypeId(done) {
            const server = hxConsentDoc.server(0);
            const typeId = hxConsentDoc.type(0).id;
            rrSuperTest.get(`/user-consent-documents/type/${typeId}`, true, 200)
                .expect((res) => {
                    const result = res.body;
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal('en');
                    }
                })
                .end(done);
        };
    };

    const patchProfileFn = function (surveyIndex, userIndex, language) {
        return function patchProfile(done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            expect(answers.length).to.be.above(2);
            const userUpdates = {
                email: `updated${userIndex}@example.com`,
                password: `newPassword${userIndex}`,
            };
            hxUser.client(userIndex).email = userUpdates.email;
            hxUser.client(userIndex).password = userUpdates.password;
            const updateObj = {
                user: userUpdates,
                answers: [answers[0], answers[1]],
                language,
            };
            const answerQxMap = new Map(updateObj.answers.map(answer => [answer.questionId, answer]));
            const newAnswers = hxAnswers[userIndex].map((hxAnswer) => {
                if (answerQxMap.has(hxAnswer.questionId)) {
                    const { questionId, answer } = answerQxMap.get(hxAnswer.questionId);
                    return { questionId, answer, language };
                }
                return hxAnswer;
            });
            hxAnswers[userIndex] = newAnswers;
            rrSuperTest.patch('/profiles', updateObj, 204).end(done);
        };
    };

    _.range(2, 4).forEach((index) => {
        it(`register user ${index} with profile survey`, createProfileWithSurveyFn(0));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`verify document 0 is not signed by user ${index}`, verifySignedDocumentFn(false));
        it(`verify document 0 is not signed by user ${index} (type name)`, verifySignedDocumentByTypeIdFn(false));
        it(`update user ${index} profile`, updateProfileWithSurveyFn(0, index));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    _.range(4, 6).forEach((index) => {
        it(`register user ${index} with profile survey 0 and doc 0 signature`, createProfileWithSurveyFn(0, [0]));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`verify document 0 is signed by user ${index}`, verifySignedDocumentFn(true));
        it(`verify document 0 is not signed by user ${index} (type name)`, verifySignedDocumentByTypeIdFn(true));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    _.range(6, 8).forEach((index) => {
        it(`register user ${index} with profile survey 1 and doc 0 signature in spanish`, createProfileWithSurveyLanguageFn(0, [0], 'es'));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index, 'es'));
        it(`verify document 0 is signed by user ${index} in spanish`, verifySignedDocumentFn(true, 'es'));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    _.range(8, 10).forEach((index) => {
        it(`register user ${index} with profile survey 1 and doc 0 signature in english`, createProfileWithSurveyLanguageFn(0, [0], 'en'));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index, 'en'));
        it(`verify document 0 is signed by user ${index} in english`, verifySignedDocumentFn(true, 'en'));
        it(`update user ${index} profile`, patchProfileFn(0, index, 'es'));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`logout as user ${index}`, shared.logoutFn());
    });
});
