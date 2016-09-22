/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const helper = require('../helper/survey-helper');

const config = require('../../config');

const shared = require('../shared-integration');
const sharedSpec = require('../shared-spec');
const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const expect = chai.expect;

describe('survey integration', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;

    const store = {
        server: null,
        auth: null,
        inputSurveys: [],
        surveyIds: [],
        surveys: []
    };

    before(shared.setUpFn(store));

    it('error: create survey unauthorized', function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .send(example.survey)
            .expect(401)
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const createSurveyFn = function () {
        return function (done) {
            const inputSurvey = sharedSpec.genNewSurvey(true);
            store.inputSurveys.push(inputSurvey);
            store.server
                .post('/api/v1.0/surveys')
                .set('Authorization', store.auth)
                .send(inputSurvey)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    store.surveyIds.push(res.body.id);
                    done();
                });
        };
    };

    const showSurveyFn = function () {
        return function (done) {
            const lastSurvey = store.inputSurveys[store.inputSurveys.length - 1];
            const id = store.surveyIds[store.surveyIds.length - 1];
            store.server
                .get(`/api/v1.0/surveys/${id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    store.surveys.push(res.body);
                    helper.buildServerSurveyFromClientSurvey(lastSurvey, res.body)
                        .then(function (expected) {
                            expect(res.body).to.deep.equal(expected);
                        })
                        .then(() => done())
                        .catch(err => done(err));
                });
        };
    };

    const listSurveysFn = function (index) {
        return function (done) {
            store.server
                .get('/api/v1.0/surveys')
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const surveys = res.body;
                    expect(surveys).to.have.length(index + 1);
                    const expected = store.surveys.map(({ id, name }) => ({ id, name }));
                    expect(surveys).to.deep.equal(expected);
                    done();
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`create survey ${i}`, createSurveyFn(i));
        it(`verify survey ${i}`, showSurveyFn(i));
        it(`list surveys and verify`, listSurveysFn(i));
    }

    it('create a new user', shared.postUserFn(store, user));

    it('login as user', shared.loginFn(store, user));

    it('error: create survey as non admin', function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .set('Authorization', store.auth)
            .send(example.survey)
            .expect(403, done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('create example survey', shared.postSurveyFn(store, example.survey));

    let serverSurvey;

    it('get empty survey', function (done) {
        store.server
            .get('/api/v1.0/surveys/name/Example')
            .expect(200)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                helper.buildServerSurveyFromClientSurvey(example.survey, res.body).then(function (expected) {
                    expect(res.body).to.deep.equal(expected);
                    serverSurvey = res.body;
                }).then(function () {
                    done();
                }).catch(function (err) {
                    done(err);
                });
            });
    });

    let answers;

    it('login as user', shared.loginFn(store, user));

    it('answer survey', function (done) {
        answers = helper.formAnswersToPost(serverSurvey, example.answer);
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
            .get('/api/v1.0/surveys/answered/name/Example')
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
