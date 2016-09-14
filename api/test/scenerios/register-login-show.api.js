/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var _ = require('lodash');
var chai = require('chai');

const appgen = require('../../app-generator');

const helper = require('../survey/survey-helper');
const models = require('../../models');

const shared = require('../shared.integration');
const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const config = require('../../config');
const request = require('supertest');

const expect = chai.expect;

const User = models.User;
const Survey = models.Survey;

describe('register-login-show scenario', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;
    const answersSpec = surveyExamples.AlzheimerSpec;

    // -------- syncAndLoadAlzheimer

    const store = {
        server: null,
        auth: null
    };

    before(function (done) {
        appgen.generate(function (err, app) {
            if (err) {
                return done(err);
            }
            store.server = request(app);
            done();
        });
    });

    it('post survey example unauthorized', function () {
        return Survey.createSurvey(surveyExample);
    });

    // --------

    // -------- client initialization

    var ethnicities;
    var genders;

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

    var survey;

    it('get survey', function (done) {
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

    // ---------

    var answers;
    var userId;

    it('register', function (done) {
        answers = helper.formAnswersToPost(survey, answersSpec);

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

    it('show without authorization', function (done) {
        store.server
            .get('/api/v1.0/registries/user-profile/Alzheimer')
            .expect(401, done);
    });

    it('login', shared.loginFn(store, userExample));

    // -----------

    // -------- show

    it('show', function (done) {
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
                expectedUser.password = user.password;
                expectedUser.role = 'participant';
                delete user.createdAt;
                delete user.updatedAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

                done();
            });
    });

    // --------
});
