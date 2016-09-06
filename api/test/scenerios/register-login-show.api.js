/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var _ = require('lodash');
var chai = require('chai');

const helper = require('../survey/survey-helper');
const models = require('../../models');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const config = require('../../config');
const request = require('supertest');

const app = require('../..');

const expect = chai.expect;

const User = models.User;
const Survey = models.Survey;

describe('Starting API Server', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;
    const answersSpec = surveyExamples.AlzheimerSpec;

    // -------- syncAndLoadAlzheimer

    before(function () {
        return models.sequelize.sync({
            force: true
        });
    });

    it('post survey example unauthorized', function () {
        return Survey.post(surveyExample);
    });

    // --------

    // -------- client initialization

    var ethnicities;
    var genders;

    it('get available ethnicities', function (done) {
        request(app)
            .get('/api/v1.0/user/ethnicity')
            .expect(200)
            .end(done);
    });

    it('get available genders', function (done) {
        request(app)
            .get('/api/v1.0/user/gender')
            .expect(200)
            .end(done);
    });

    var survey;

    it('get survey', function (done) {
        request(app)
            .get('/api/v1.0/survey/empty/Alzheimer')
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

        request(app)
            .post('/api/v1.0/user/register')
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

    var token;

    it('login', function (done) {
        request(app)
            .get('/api/v1.0/auth/basic')
            .auth(userExample.username, userExample.password)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                token = res.body.token;
                done();
            });
    });

    // -----------

    // -------- show

    it('show', function (done) {
        request(app)
            .get('/api/v1.0/user/me-and-survey/Alzheimer')
            .set('Authorization', 'Bearer ' + token)
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
