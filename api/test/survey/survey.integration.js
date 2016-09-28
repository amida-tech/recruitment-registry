/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const helper = require('../helper/survey-helper');

const config = require('../../config');

const shared = require('../shared-integration');
const sharedSpec = require('../shared-spec');
const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');
const RRError = require('../../lib/rr-error');

const expect = chai.expect;

describe('survey integration', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;
    const createCount = 8;

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

    const createSurveyFn = function (index) {
        return function (done) {
            const inputSurvey = sharedSpec.genNewSurvey({ released: index < 4 });
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

    const showSurveyFn = function (index, update = {}) {
        return function (done) {
            const inputSurvey = store.inputSurveys[index];
            const id = store.surveyIds[index];
            store.server
                .get(`/api/v1.0/surveys/${id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    if (_.isEmpty(update)) {
                        store.surveys.push(res.body);
                    }
                    const expected = Object.assign({}, inputSurvey, update);
                    helper.buildServerSurvey(expected, res.body)
                        .then(function (expected) {
                            expect(res.body).to.deep.equal(expected);
                        })
                        .then(() => done())
                        .catch(err => done(err));
                });
        };
    };

    const compareSurveyFn = function (index) {
        return function (done) {
            const survey = store.surveys[index];
            store.server
                .get(`/api/v1.0/surveys/${survey.id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.deep.equal(survey);
                    done();
                });
        };
    };

    const updateSurveyFn = function (index, name) {
        return function (done) {
            const id = store.surveyIds[index];
            name = name || store.inputSurveys[index].name;
            store.server
                .put(`/api/v1.0/surveys/${id}`)
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
                    const expected = store.surveys.map(({ id, name, released }) => ({ id, name, released }));
                    expect(surveys).to.deep.equal(expected);
                    done();
                });
        };
    };

    for (let i = 0; i < createCount; ++i) {
        it(`create survey ${i}`, createSurveyFn(i));
        it(`verify survey ${i}`, showSurveyFn(i));
        const name = `updated_name_${i}`;
        it(`update survey ${i}`, updateSurveyFn(i, name));
        it(`verify survey ${i}`, showSurveyFn(i, { name }));
        it(`update survey ${i}`, updateSurveyFn(i));
        it(`list surveys and verify`, listSurveysFn(i));
    }

    it('error: update name and release', function (done) {
        const id = store.surveyIds[2];
        store.server
            .put(`/api/v1.0/surveys/${id}`)
            .set('Authorization', store.auth)
            .send({ name: 'any_name', released: true })
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(!!res.body.message).to.equal(true);
                done();
            });
    });

    it('error: release an already released survey', function (done) {
        const releasedSurvey = store.surveys[1];
        expect(releasedSurvey.released).to.equal(true);
        const id = releasedSurvey.id;
        store.server
            .put(`/api/v1.0/surveys/released/${id}`)
            .set('Authorization', store.auth)
            .send({})
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.equal(RRError.message('surveyAlreadyReleased'));
                done();
            });
    });

    it('error: release a non existant survey', function (done) {
        store.server
            .put(`/api/v1.0/surveys/released/999`)
            .set('Authorization', store.auth)
            .send({})
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.equal(RRError.message('surveyNotFound'));
                done();
            });
    });

    const releaseSurveyFn = function (index) {
        return function (done) {
            const survey = store.surveys[index];
            const id = survey.id;
            expect(survey.released).to.equal(false);
            store.server
                .put(`/api/v1.0/surveys/released/${id}`)
                .set('Authorization', store.auth)
                .send({})
                .expect(200)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    survey.released = true;
                    done();
                });
        };
    };

    it('release a survey', releaseSurveyFn(4));

    it('verify released survey', compareSurveyFn(4));

    const versionSurveyFn = function (index, released) {
        return function (done) {
            const replacement = sharedSpec.genNewSurvey({ released });
            store.inputSurveys.push(replacement);
            const id = store.surveys[index].id;
            store.server
                .post(`/api/v1.0/surveys/version`)
                .set('Authorization', store.auth)
                .send({ id, replacement })
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

    it('version to draft survey', versionSurveyFn(1, false));
    it('verify draft survey', showSurveyFn(createCount));
    it(`list surveys and verify`, listSurveysFn(createCount));
    it('release draft survey', releaseSurveyFn(createCount));
    it('remove versioned survey locally', function () {
        store.inputSurveys.splice(1, 1);
        store.surveys.splice(1, 1);
        store.surveyIds.splice(1, 1);
    });
    it(`list surveys and verify`, listSurveysFn(createCount - 1));

    it('version to a released survey', versionSurveyFn(3, true));
    it('remove versioned survey locally', function () {
        store.inputSurveys.splice(3, 1);
        store.surveys.splice(3, 1);
        store.surveyIds.splice(3, 1);
    });
    it('verify version survey', showSurveyFn(createCount - 1));
    it(`list surveys and verify`, listSurveysFn(createCount - 1));

    const deleteSurveyFn = function (index) {
        return function (done) {
            const survey = store.surveys[index];
            store.server
                .delete(`/api/v1.0/surveys/${survey.id}`)
                .set('Authorization', store.auth)
                .expect(204, done);
        };
    };

    it('delete survey', deleteSurveyFn(5));
    it('remove deleted survey locally', function () {
        store.inputSurveys.splice(5, 1);
        store.surveys.splice(5, 1);
        store.surveyIds.splice(5, 1);
    });
    it(`list surveys and verify`, listSurveysFn(createCount - 2));

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
