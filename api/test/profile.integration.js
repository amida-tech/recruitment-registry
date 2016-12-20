/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const ConsentDocumentHistory = require('./util/consent-document-history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('profile integration', function () {
    const store = new RRSuperTest();

    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);

    before(shared.setUpFn(store));

    const createProfileFn = function () {
        return function (done) {
            const user = generator.newUser();
            const input = { user };
            store.authPost('/profiles', input, 201)
                .expect(function () {
                    hxUser.push(user, {});
                    hxAnswers.push(null);
                })
                .end(done);
        };
    };

    const verifyProfileFn = function (userIndex) {
        return function (done) {
            store.get('/profiles', true, 200)
                .expect(function (res) {
                    const result = res.body;
                    comparator.user(hxUser.client(userIndex), result.user);
                })
                .end(done);
        };
    };

    const updateProfileFn = function (userIndex) {
        return function (done) {
            const userUpdates = {
                email: `updated${userIndex}@example.com`
            };
            hxUser.client(userIndex).email = userUpdates.email;
            const updateObj = {
                user: userUpdates
            };
            store.patch('/profiles', updateObj, 204)
                .end(done);
        };
    };

    _.range(0, 2).forEach(index => {
        it(`register user ${index} with profile`, createProfileFn());
        it(`verify user ${index} profile`, verifyProfileFn(index));
        it(`update user ${index} profile`, updateProfileFn(index));
        it(`verify user ${index} profile`, verifyProfileFn(index));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 0; i < 2; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(store, hxConsentDoc));
    }
    for (let i = 0; i < 2; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(store, hxConsentDoc, i));
    }
    it('create profile survey', shared.createProfileSurveyFn(store, hxSurvey));
    it('logout as super', shared.logoutFn(store));

    it(`get/verify profile survey`, shared.verifyProfileSurveyFn(store, hxSurvey, 0));

    const createProfileWithSurveyFn = function (surveyIndex, signatures) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            store.authPost('/profiles', input, 201)
                .expect(function () {
                    hxUser.push(clientUser, {});
                })
                .end(done);
        };
    };

    const createProfileWithSurveyLanguageFn = function (surveyIndex, signatures, language) {
        return function (done) {
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
            store.authPost('/profiles', input, 201)
                .expect(function () {
                    hxUser.push(clientUser, {});
                })
                .end(done);
        };
    };

    const verifyProfileWithSurveyFn = function (surveyIndex, userIndex, language) {
        return function (done) {
            store.get('/profiles', true, 200)
                .expect(function (res) {
                    const result = res.body;
                    const survey = hxSurvey.server(surveyIndex);

                    comparator.user(hxUser.client(userIndex), result.user);
                    comparator.answeredSurvey(survey, hxAnswers[userIndex], result.survey, language);

                })
                .end(done);
        };
    };

    const updateProfileWithSurveyFn = function (surveyIndex, userIndex) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const userUpdates = {
                email: `updated${userIndex}@example.com`
            };
            hxUser.client(userIndex).email = userUpdates.email;
            const updateObj = {
                user: userUpdates,
                answers
            };
            hxAnswers[userIndex] = answers;
            store.patch('/profiles', updateObj, 204).end(done);
        };
    };

    const verifySignedDocumentFn = function (expected, language) {
        return function (done) {
            const server = hxConsentDoc.server(0);
            store.get(`/user-consent-documents/${server.id}`, true, 200)
                .expect(function (res) {
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

    const verifySignedDocumentByTypeNameFn = function (expected) {
        return function (done) {
            const server = hxConsentDoc.server(0);
            const typeName = hxConsentDoc.type(0).name;
            store.get(`/user-consent-documents/type-name/${typeName}`, true, 200)
                .expect(function (res) {
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
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            expect(answers.length).to.be.above(2);
            const userUpdates = {
                email: `updated${userIndex}@example.com`,
                password: `newPassword${userIndex}`
            };
            hxUser.client(userIndex).email = userUpdates.email;
            hxUser.client(userIndex).password = userUpdates.password;
            const updateObj = {
                user: userUpdates,
                answers: [answers[0], answers[1]],
                language
            };
            const answerQxMap = new Map(updateObj.answers.map(answer => [answer.questionId, answer]));
            const newAnswers = hxAnswers[userIndex].map(hxAnswer => {
                if (answerQxMap.has(hxAnswer.questionId)) {
                    const { questionId, answer } = answerQxMap.get(hxAnswer.questionId);
                    return { questionId, answer, language };
                } else {
                    return hxAnswer;
                }
            });
            hxAnswers[userIndex] = newAnswers;
            store.patch('/profiles', updateObj, 204).end(done);
        };
    };

    _.range(2, 4).forEach(index => {
        it(`register user ${index} with profile survey`, createProfileWithSurveyFn(0));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`verify document 0 is not signed by user ${index}`, verifySignedDocumentFn(false));
        it(`verify document 0 is not signed by user ${index} (type name)`, verifySignedDocumentByTypeNameFn(false));
        it(`update user ${index} profile`, updateProfileWithSurveyFn(0, index));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    _.range(4, 6).forEach(index => {
        it(`register user ${index} with profile survey 0 and doc 0 signature`, createProfileWithSurveyFn(0, [0]));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`verify document 0 is signed by user ${index}`, verifySignedDocumentFn(true));
        it(`verify document 0 is not signed by user ${index} (type name)`, verifySignedDocumentByTypeNameFn(true));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    _.range(6, 8).forEach(index => {
        it(`register user ${index} with profile survey 1 and doc 0 signature in spanish`, createProfileWithSurveyLanguageFn(0, [0], 'es'));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index, 'es'));
        it(`verify document 0 is signed by user ${index} in spanish`, verifySignedDocumentFn(true, 'es'));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });

    _.range(8, 10).forEach(index => {
        it(`register user ${index} with profile survey 1 and doc 0 signature in english`, createProfileWithSurveyLanguageFn(0, [0], 'en'));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index, 'en'));
        it(`verify document 0 is signed by user ${index} in english`, verifySignedDocumentFn(true, 'en'));
        it(`update user ${index} profile`, patchProfileFn(0, index, 'es'));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`logout as user ${index}`, shared.logoutFn(store));
    });
});
