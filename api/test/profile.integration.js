/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const ConsentDocumentHistory = require('./util/consent-document-history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('profile integration', function () {
    const store = {
        server: null,
        auth: null
    };

    const hxSurvey = new History(['id', 'name']);
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);

    before(shared.setUpFn(store));

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

    const createProfileFn = function (surveyIndex, signatures) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            clientUser.role = 'participant';
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            store.server
                .post('/api/v1.0/profiles')
                .send(input)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    store.auth = 'Bearer ' + res.body.token;
                    hxUser.push(clientUser, {});
                    done();
                });
        };
    };

    const createProfileLanguageFn = function (surveyIndex, signatures, language) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            clientUser.role = 'participant';
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            if (language) {
                input.language = language;
            }
            store.server
                .post('/api/v1.0/profiles')
                .send(input)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    store.auth = 'Bearer ' + res.body.token;
                    hxUser.push(clientUser, {});
                    done();
                });
        };
    };

    const verifyProfileFn = function (surveyIndex, userIndex, language) {
        return function (done) {
            store.server
                .get('/api/v1.0/profiles')
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const result = res.body;
                    const survey = hxSurvey.server(surveyIndex);

                    comparator.user(hxUser.client(userIndex), result.user);
                    comparator.answeredSurvey(survey, hxAnswers[userIndex], result.survey, language);

                    done();
                });
        };
    };

    const updateProfileFn = function (surveyIndex, userIndex) {
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
            store.server
                .patch('/api/v1.0/profiles')
                .set('Authorization', store.auth)
                .send(updateObj)
                .expect(204, done);
        };
    };

    const verifySignedDocumentFn = function (expected, language) {
        return function (done) {
            const server = hxConsentDoc.server(0);
            store.server
                .get(`/api/v1.0/user-consent-documents/${server.id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const result = res.body;
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal(language || 'en');
                    }
                    done();
                });
        };
    };

    const verifySignedDocumentByTypeNameFn = function (expected) {
        return function (done) {
            const server = hxConsentDoc.server(0);
            const typeName = hxConsentDoc.type(0).name;
            store.server
                .get(`/api/v1.0/user-consent-documents/type-name/${typeName}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const result = res.body;
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal('en');
                    }
                    done();
                });
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
            store.server
                .patch('/api/v1.0/profiles')
                .set('Authorization', store.auth)
                .send(updateObj)
                .expect(204, done);
        };
    };

    it('register user 0 with profile survey 0', createProfileFn(0));

    it('verify user 0 profile', verifyProfileFn(0, 0));

    it('verify document 0 is not signed by user 0', verifySignedDocumentFn(false));

    it('verify document 0 is not signed by user 0 (type name)', verifySignedDocumentByTypeNameFn(false));

    it('update user 0 profile', updateProfileFn(0, 0));

    it('verify user 0 profile', verifyProfileFn(0, 0));

    it('register user 1 with profile survey 0 and doc 0 signature', createProfileFn(0, [0]));

    it('verify user 1 profile', verifyProfileFn(0, 1));

    it('verify document 0 is signed by user 1', verifySignedDocumentFn(true));

    it('verify document 0 is not signed by user 1 (type name)', verifySignedDocumentByTypeNameFn(true));

    it('register user 2 with profile survey 1 and doc 0 signature in spanish', createProfileLanguageFn(0, [0], 'es'));

    it('verify user 2 profile', verifyProfileFn(0, 2, 'es'));

    it('verify document 0 is signed by user in spanish', verifySignedDocumentFn(true, 'es'));

    it('register user 3 with profile survey 1 and doc 0 signature in english', createProfileLanguageFn(0, [0], 'en'));

    it('verify user 3 profile', verifyProfileFn(0, 3, 'en'));

    it('verify document 0 is signed by user in english', verifySignedDocumentFn(true, 'en'));

    it('update user 3 profile', patchProfileFn(0, 3, 'es'));

    it('verify user 0 profile', verifyProfileFn(0, 3));
});
