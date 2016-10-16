/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const helper = require('./helper/survey-helper');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const userExamples = require('./fixtures/example/user');
const surveyExamples = require('./fixtures/example/survey');

const invalidSurveysJSON = require('./fixtures/json-schema-invalid/new-survey');
const invalidSurveysSwagger = require('./fixtures/swagger-invalid/new-survey');

const RRError = require('../lib/rr-error');

const expect = chai.expect;
const entityGen = new Generator();
const shared = new SharedIntegration();

describe('survey integration', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;
    const hxUser = new History();
    const surveyCount = 8;

    const store = {
        server: null,
        auth: null
    };

    const history = new History(['id', 'name']);

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
            const clientSurvey = entityGen.newSurvey();
            store.server
                .post('/api/v1.0/surveys')
                .set('Authorization', store.auth)
                .send(clientSurvey)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.push(clientSurvey, res.body);
                    done();
                });
        };
    };

    const showSurveyFn = function (index, update = {}) {
        return function (done) {
            const id = history.id(index);
            store.server
                .get(`/api/v1.0/surveys/${id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    if (_.isEmpty(update)) {
                        history.completeLastServer(res.body);
                    }
                    const clientSurvey = history.client(index);
                    const expected = Object.assign({}, clientSurvey, update);
                    helper.buildServerSurvey(expected, res.body)
                        .then(function (expected) {
                            expect(res.body).to.deep.equal(expected);
                        })
                        .then(() => done())
                        .catch(err => done(err));
                });
        };
    };

    const updateSurveyFn = function (index, name) {
        return function (done) {
            const id = history.id(index);
            name = name || history.client(index).name;
            store.server
                .patch(`/api/v1.0/surveys/${id}`)
                .set('Authorization', store.auth)
                .send({ name })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.deep.equal({});
                    done();
                });
        };
    };

    const listSurveysFn = function () {
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
                    const expected = history.listServers();
                    expect(surveys).to.deep.equal(expected);
                    done();
                });
        };
    };

    const invalidSurveyJSONFn = function (index) {
        return function (done) {
            const survey = invalidSurveysJSON[index];
            store.server
                .post('/api/v1.0/surveys')
                .set('Authorization', store.auth)
                .send(survey)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.message).to.equal(RRError.message('jsonSchemaFailed', 'newSurvey'));
                    done();
                });
        };
    };

    for (let i = 0; i < invalidSurveysJSON.length; ++i) {
        it(`error: invalid (json) survey input ${i}`, invalidSurveyJSONFn(i));
    }

    const invalidSurveySwaggerFn = function (index) {
        return function (done) {
            const survey = invalidSurveysSwagger[index];
            store.server
                .post('/api/v1.0/surveys')
                .set('Authorization', store.auth)
                .send(survey)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(Boolean(res.body.message)).to.equal(true);
                    done();
                });
        };
    };

    for (let i = 0; i < invalidSurveysSwagger.length; ++i) {
        it(`error: invalid (swagger) survey input ${i}`, invalidSurveySwaggerFn(i));
    }

    for (let i = 0; i < surveyCount; ++i) {
        it(`create survey ${i}`, createSurveyFn());
        it(`verify survey ${i}`, showSurveyFn(i));
        const name = `updated_name_${i}`;
        it(`update survey ${i}`, updateSurveyFn(i, name));
        it(`verify survey ${i}`, showSurveyFn(i, { name }));
        it(`update survey ${i}`, updateSurveyFn(i));
        it(`list surveys and verify`, listSurveysFn());
    }

    const replaceSurveyFn = function (index) {
        return function (done) {
            const replacement = entityGen.newSurvey();
            const id = history.id(index);
            store.server
                .post(`/api/v1.0/surveys`)
                .query({ parent: id })
                .set('Authorization', store.auth)
                .send(replacement)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.replace(index, replacement, res.body);
                    done();
                });

        };
    };

    it('replace survey 3', replaceSurveyFn(3));
    it('verify survey 3 replacement', showSurveyFn(surveyCount));
    it(`list surveys and verify`, listSurveysFn());

    const deleteSurveyFn = function (index) {
        return function (done) {
            const id = history.id(index);
            store.server
                .delete(`/api/v1.0/surveys/${id}`)
                .set('Authorization', store.auth)
                .expect(204, done);
        };
    };

    it('delete survey 5', deleteSurveyFn(5));
    it('remove deleted survey locally', function () {
        history.remove(5);
    });
    it(`list surveys and verify`, listSurveysFn());

    it('create a new user', shared.createUserFn(store, hxUser, user));

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
                helper.buildServerSurvey(example.survey, res.body).then(function (expected) {
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
