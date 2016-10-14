/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const config = require('../config');
const RRError = require('../lib/rr-error');

const SharedIntegration = require('./util/shared-integration');
const surveyHelper = require('./helper/survey-helper');

const surveyExamples = require('./fixtures/example/survey');
const userExamples = require('./fixtures/example/user');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('registry integration', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('error: create profile survey unauthorized', function (done) {
        store.server
            .post('/api/v1.0/profile-survey')
            .send(surveyExample.survey)
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
        store.server
            .post('/api/v1.0/profile-survey')
            .set('Authorization', store.auth)
            .send(surveyExample.survey)
            .expect(201)
            .end(done);
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
                return surveyHelper.buildServerSurvey(surveyExample.survey, res.body)
                    .then(function (expected) {
                        expect(res.body).to.deep.equal(expected);
                        store.survey = res.body;
                    })
                    .then(() => done())
                    .catch((err) => done(err));
            });
    });

    let answers;

    it('fill user profile and submit', function (done) {
        answers = surveyHelper.formAnswersToPost(store.survey, surveyExample.answer);

        store.server
            .post('/api/v1.0/profiles')
            .send({
                user: userExample,
                answers
            })
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                store.auth = 'Bearer ' + res.body.token;
                done();
            });
    });

    it('verify user profile', function (done) {
        store.server
            .get('/api/v1.0/profiles')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = surveyHelper.formAnsweredSurvey(store.survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

                done();
            });
    });

    it('update user profile', function (done) {
        answers = surveyHelper.formAnswersToPost(store.survey, surveyExample.answerUpdate);
        const userUpdates = {
            zip: '20999',
            gender: 'other'
        };
        store.server
            .patch('/api/v1.0/profiles')
            .set('Authorization', store.auth)
            .send({
                user: userUpdates,
                answers
            })
            .expect(200, done);
    });

    it('verify user profile', function (done) {
        store.server
            .get('/api/v1.0/profiles')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                expectedUser.zip = '20999';
                expectedUser.gender = 'other';
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = surveyHelper.formAnsweredSurvey(store.survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

                done();
            });
    });
});
