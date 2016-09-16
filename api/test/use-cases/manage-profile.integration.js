/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var _ = require('lodash');
var chai = require('chai');

const helper = require('../survey/survey-helper');

const shared = require('../shared.integration');
const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const config = require('../../config');

const expect = chai.expect;

describe('user set-up and login use-case', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    // -------- set up system (syncAndLoadAlzheimer)

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('login as super user', shared.loginFn(store, config.superUser));

    it('post example survey', shared.postSurveyFn(store, surveyExample.survey));

    // --------

    // -------- client initialization

    var ethnicities;
    var genders;
    let survey;

    it('get available ethnicities', function (done) {
        store.server
            .get('/api/v1.0/ethnicities')
            .expect(200)
            .end(done);
    });

    it('get available genders', function (done) {
        store.server
            .get('/api/v1.0/genders')
            .expect(200)
            .end(done);
    });

    it('get profile survey', function (done) {
        store.server
            .get('/api/v1.0/surveys/empty/Alzheimer')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                survey = res.body;
                done();
            });
    });

    // --------- set up account

    var answers;
    var userId;

    it('fill user profile and submit', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        store.server
            .post('/api/v1.0/registries/user-profile')
            .send({
                user: userExample,
                surveyId: survey.id,
                answers
            })
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const result = res.body;
                userId = result.id;
                done();
            });
    });

    // --------- login

    it('error show user profile without user logs in', function (done) {
        store.server
            .get('/api/v1.0/registries/user-profile/Alzheimer')
            .expect(401, done);
    });

    it('login', shared.loginFn(store, userExample));

    // -----------

    // -------- verification

    it('verify user profile', function (done) {
        store.server
            .get('/api/v1.0/registries/user-profile/Alzheimer')
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
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

                done();
            });
    });

    // --------

    it('update user profile', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answerUpdate);
        const userUpdates = {
            zip: '20999',
            gender: 'other'
        };
        store.server
            .put('/api/v1.0/registries/user-profile')
            .set('Authorization', store.auth)
            .send({
                user: userUpdates,
                surveyId: survey.id,
                answers
            })
            .expect(200, done);
    });

    it('verify user profile', function (done) {
        store.server
            .get('/api/v1.0/registries/user-profile/Alzheimer')
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
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

                done();
            });
    });
});
