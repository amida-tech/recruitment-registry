/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const appgen = require('../../app-generator');

const helper = require('./survey-helper');
const models = require('../../models');

const config = require('../../config');
const request = require('supertest');

const shared = require('../shared.integration');
const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const expect = chai.expect;

const User = models.User;
const Ethnicity = models.Ethnicity;

describe('survey integration', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;
    const answersSpec = surveyExamples.ExampleSpec;

    const store = {
        server: null,
        auth: null
    };

    before(function (done) {
        appgen.generate(function (err, app) {
            if (err) {
                return done(err);
            }
            const userin = _.cloneDeep(user);
            userin.role = 'participant';
            User.create(userin).then(function () {
                store.server = request(app);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });

    it('post survey example nobody authorized', function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .send(example)
            .expect(401)
            .end(done);
    });

    it('login with user', shared.loginFn(store, user));

    it('post survey example participant', function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .set('Authorization', store.auth)
            .send(example)
            .expect(403, done);
    });

    it('login with admin', shared.loginFn(store, config.initialUser));

    it('post survey example authorized', function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .set('Authorization', store.auth)
            .send(example)
            .expect(201)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(done);
    });

    var serverSurvey;

    it('get empty survey', function (done) {
        store.server
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

    it('login with user', shared.loginFn(store, user));

    it('answer survey', function (done) {
        answers = helper.formAnswersToPost(serverSurvey, answersSpec);
        const id = serverSurvey.id;
        store.server
            .post('/api/v1.0/answers')
            .set('Authorization', store.auth)
            .send({
                surveyId: id,
                answers
            })
            .expect(201)
            .end(done);
    });

    it('get answered survey', function (done) {
        store.server
            .get('/api/v1.0/surveys/Example')
            .set('Authorization', store.auth)
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
