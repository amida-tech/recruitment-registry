/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const config = require('../../config');

const shared = require('../shared-integration');
const surveyHelper = require('../helper/survey-helper');

const examples = require('../fixtures/registry-examples');
const surveyExamples = require('../fixtures/survey-examples');
const userExamples = require('../fixtures/user-examples');

const expect = chai.expect;

describe('registry integration', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('error: create registry unauthorized', function (done) {
        store.server
            .post('/api/v1.0/registries')
            .send(examples[0])
            .expect(401)
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const ids = [];

    const createRegistryFn = function (index) {
        return function (done) {
            store.server
                .post('/api/v1.0/registries')
                .set('Authorization', store.auth)
                .send(examples[index])
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    ids.push(res.body.id);
                    done();
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`create registry ${i}`, createRegistryFn(i));
    }

    const getAndVerifyRegistryFn = function (index) {
        return function (done) {
            store.server
                .get(`/api/v1.0/registries/${ids[index]}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const { name, survey } = res.body;
                    expect(name).to.equal(examples[index].name);
                    return surveyHelper.buildServerSurvey(examples[index].survey, survey)
                        .then(function (expected) {
                            expect(survey).to.deep.equal(expected);
                        })
                        .then(() => done())
                        .catch((err) => done(err));
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`get registry ${i}`, getAndVerifyRegistryFn(i));
    }

    const getByNameAndVerifyRegistryFn = function (index) {
        return function (done) {
            store.server
                .get(`/api/v1.0/registries/name/${examples[index].name}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const { name, survey } = res.body;
                    expect(name).to.equal(examples[index].name);
                    return surveyHelper.buildServerSurvey(examples[index].survey, survey)
                        .then(function (expected) {
                            expect(survey).to.deep.equal(expected);
                        })
                        .then(() => done())
                        .catch((err) => done(err));
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`get registry ${i} by name`, getByNameAndVerifyRegistryFn(i));
    }

    it('logout as super', shared.logoutFn(store));

    const getProfileSurveyAndVerifyFn = function (index) {
        return function (done) {
            store.server
                .get(`/api/v1.0/registries/profile-survey/${examples[index].name}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const survey = res.body;
                    return surveyHelper.buildServerSurvey(examples[index].survey, survey)
                        .then(function (expected) {
                            expect(survey).to.deep.equal(expected);
                        })
                        .then(() => done())
                        .catch((err) => done(err));
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`get registry profile survey ${i} by name`, getProfileSurveyAndVerifyFn(i));
    }

    let survey;

    it('get user profile survey', function (done) {
        store.server
            .get('/api/v1.0/registries/profile-survey/Alzheimer')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                survey = res.body;
                done();
            });
    });

    let answers;

    it('fill user profile and submit', function (done) {
        answers = surveyHelper.formAnswersToPost(survey, surveyExample.answer);

        store.server
            .post('/api/v1.0/registries/user-profile')
            .send({
                user: userExample,
                registryName: survey.name,
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
            .get('/api/v1.0/registries/user-profile')
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
                const expectedSurvey = surveyHelper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

                done();
            });
    });

    it('update user profile', function (done) {
        answers = surveyHelper.formAnswersToPost(survey, surveyExample.answerUpdate);
        const userUpdates = {
            zip: '20999',
            gender: 'other'
        };
        store.server
            .put('/api/v1.0/registries/user-profile')
            .set('Authorization', store.auth)
            .send({
                user: userUpdates,
                answers
            })
            .expect(200, done);
    });

    it('verify user profile', function (done) {
        store.server
            .get('/api/v1.0/registries/user-profile')
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
                const expectedSurvey = surveyHelper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);

                done();
            });
    });
});
