/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');

const helper = require('./survey-helper');
const db = require('../../db');

const config = require('../../config');
const request = require('supertest');

const app = require('../..');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const expect = chai.expect;

const User = db.User;
const Ethnicity = db.Ethnicity;

describe('survey integration', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;
    const answersSpec = surveyExamples.ExampleSpec;

    before(function () {
        return db.sequelize.sync({
            force: true
        }).then(function () {
            return User.create(user);
        });
    });

    it('post survey example unauthorized', function (done) {
        request(app)
            .post('/api/v1.0/survey')
            .send(example)
            .expect(401)
            .end(done);
    });

    let token;

    it('authenticate user', function (done) {
        request(app)
            .get('/auth/v1.0/local')
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
            .post('/api/v1.0/survey')
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
            .get('/api/v1.0/survey/empty/Example')
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
            .post('/api/v1.0/survey/answer')
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
            .get('/api/v1.0/survey/named/Example')
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
