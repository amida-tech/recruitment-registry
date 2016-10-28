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
const ConsentDocumentHistory = require('./util/consent-document-history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('registry integration', function () {
    const store = {
        server: null,
        auth: null
    };

    const hxSurvey = new History(['id', 'name']);
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);

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

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 2; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(store, hxConsentDoc));
    }

    for (let i = 0; i < 2; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(store, hxConsentDoc, i));
    }

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

    it('create profile survey', createProfileSurveyFn());

    it('logout as super', shared.logoutFn(store));

    const verifyProfileSurveyFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/profile-survey')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const index = 0;
                    const id = hxSurvey.id(index);
                    expect(res.body.id).to.equal(id);
                    hxSurvey.updateServer(index, res.body);
                    comparator.survey(hxSurvey.client(index), res.body)
                        .then(done, done);
                });
        };
    };

    it(`get profile survey`, verifyProfileSurveyFn());

    const createProfileFn = function (surveyIndex) {
        return function (done) {
            //const signatures = [0];
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            clientUser.role = 'participant';
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            //if (signatures) {
            //    input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            //}
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

    const verifyProfileFn = function (surveyIndex, userIndex) {
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
                    comparator.answeredSurvey(survey, hxAnswers[userIndex], result.survey);

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

    it('register user 0 with profile survey 0', createProfileFn(0));

    it('verify user 0 profile', verifyProfileFn(0, 0));

    it('update user 0 profile', updateProfileFn(0, 0));

    it('verify user 0 profile', verifyProfileFn(0, 0));
});
