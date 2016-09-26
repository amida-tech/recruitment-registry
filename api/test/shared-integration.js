'use strict';

const request = require('supertest');
const chai = require('chai');

const appgen = require('../app-generator');
const entityGen = require('./shared-spec');

const expect = chai.expect;

exports.setUpFn = function (store) {
    return function (done) {
        appgen.generate(function (err, app) {
            if (err) {
                return done(err);
            }
            store.server = request(app);
            done();
        });
    };
};

exports.loginFn = function (store, login) {
    return function (done) {
        store.server
            .get('/api/v1.0/auth/basic')
            .auth(login.username, login.password)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                store.auth = 'Bearer ' + res.body.token;
                done();
            });
    };
};

exports.logoutFn = function (store) {
    return function () {
        store.auth = null;
    };
};

exports.badLoginFn = function (store, login) {
    return function (done) {
        store.server
            .get('/api/v1.0/auth/basic')
            .auth(login.username, login.password)
            .expect(401, done);
    };
};

exports.postUserFn = function (store, user) {
    return function (done) {
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(user)
            .expect(201, done);
    };
};

exports.createUserFn = function (store) {
    const user = entityGen.genNewUser();
    store.users.push(user);
    return exports.postUserFn(store, user);
};

exports.createQxFn = function (store) {
    return function (done) {
        const inputQx = entityGen.genNewQuestion();
        store.server
            .post('/api/v1.0/questions')
            .set('Authorization', store.auth)
            .send(inputQx)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                store.questionIds.push(res.body.id.toString());
                done();
            });
    };
};

exports.fillQxFn = function (store) {
    return function (done) {
        const id = store.questionIds[store.questionIds.length - 1];
        store.server
            .get(`/api/v1.0/questions/${id}`)
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const question = res.body;
                store.questions.push({
                    id,
                    type: question.type,
                    choices: question.choices
                });
                done();
            });

    };
};

exports.postSurveyFn = function (store, survey) {
    return function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .set('Authorization', store.auth)
            .send(survey)
            .expect(201)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(done);
    };
};

exports.createSurveyFn = function (store, qxIndices) {
    return function (done) {
        const inputSurvey = entityGen.genNewSurvey();
        inputSurvey.questions = qxIndices.map(index => ({
            id: store.questionIds[index]
        }));
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

exports.postRegistryFn = function (store, registry) {
    return function (done) {
        store.server
            .post('/api/v1.0/registries')
            .set('Authorization', store.auth)
            .send(registry)
            .expect(201)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(done);
    };
};
