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
//const ConsentDocumentHistory = require('./util/consent-document-history');

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
    //const hxConsentDoc = new ConsentDocumentHistory(2);

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

    it('create profile survey', function (done) {
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
    });

    it('logout as super', shared.logoutFn(store));

    it(`get profile survey`, function (done) {
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
    });

    it('fill user profile and submit', function (done) {
        const surveyIndex = 0;
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
    });

    it('verify user profile', function (done) {
        const surveyIndex = 0;
        const userIndex = 0;
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
    });

    it('update user profile', function (done) {
        const surveyIndex = 0;
        const userIndex = 0;
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
    });

    it('verify user profile', function (done) {
        const surveyIndex = 0;
        const userIndex = 0;
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
    });
});
