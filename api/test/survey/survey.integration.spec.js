/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');

const helper = require('./survey-helper');
const models = require('../../models');

const config = require('../../config');
const request = require('supertest');

const app = require('../..');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const expect = chai.expect;

const User = models.User;
const Ethnicity = models.Ethnicity;

describe('survey integration', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;
    const answersSpec = surveyExamples.ExampleSpec;

    before(function () {
        return models.sequelize.sync({
            force: true
        }).then(function () {
            return User.create(user);
        });
    });

    it('post survey example unauthorized', function (done) {
        request(app)
            .post('/api/v1.0/surveys')
            .send(example)
            .expect(401)
            .end(done);
    });

    let token;

    it('authenticate user', function (done) {
        request(app)
            .get('/api/v1.0/auth/basic')
            .auth(user.username, user.password)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                token = res.body.token;
                done();
            });
    });

    it('post survey example authorized', function (done) {
        request(app)
            .post('/api/v1.0/surveys')
            .set('Authorization', 'Bearer ' + token)
            .send(example)
            .expect(201)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(done);
    });

    var serverSurvey;

    it('get empty survey', function (done) {
        request(app)
            .get('/api/v1.0/surveys/empty/Example')
            .expect(200)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                helper.buildServerSurveyFromClientSurvey(example, res.body).then(function (expected) {
                    expect(res.body).to.deep.equal(expected);
                    serverSurvey = res.body;
                }).then(function () {
                    done();
                }).catch(function (err) {
                    done(err);
                });
            });
    });

    var answers;

    it('answer survey', function (done) {
        answers = helper.formAnswersToPost(serverSurvey, answersSpec);
        const id = serverSurvey.id;
        request(app)
            .post('/api/v1.0/answers')
            .set('Authorization', 'Bearer ' + token)
            .send({
                surveyId: id,
                answers
            })
            .expect(201)
            .end(done);
    });

    it('get answered survey', function (done) {
        request(app)
            .get('/api/v1.0/surveys/named/Example')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const expected = helper.formAnsweredSurvey(serverSurvey, answers);
                expect(res.body).to.deep.equal(expected);
                done();
            });
    });
});
