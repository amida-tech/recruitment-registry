'use strict';

const request = require('supertest');
const chai = require('chai');
const _ = require('lodash');

const appgen = require('../../app-generator');
const Generator = require('./entity-generator');

const expect = chai.expect;

class SharedIntegration {
    constructor(generator) {
        this.generator = generator || new Generator();
    }

    setUpFn(store, options = {}) {
        return function (done) {
            appgen.generate(options, function (err, app) {
                if (err) {
                    return done(err);
                }
                store.server = request(app);
                done();
            });
        };
    }

    loginFn(store, login) {
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
    }

    loginIndexFn(store, history, index) {
        const shared = this;
        return function (done) {
            const login = history.client(index);
            shared.loginFn(store, login)(done);
        };
    }

    logoutFn(store) {
        return function () {
            store.auth = null;
        };
    }

    badLoginFn(store, login) {
        return function (done) {
            store.server
                .get('/api/v1.0/auth/basic')
                .auth(login.username, login.password)
                .expect(401, done);
        };
    }

    createUserFn(store, history, user) {
        return function (done) {
            store.server
                .post('/api/v1.0/users')
                .set('Authorization', store.auth)
                .send(user)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.push(user, res.body);
                    done();
                });
        };
    }

    createQxFn(store) {
        const generator = this.generator;
        return function (done) {
            const inputQx = generator.newQuestion();
            store.server
                .post('/api/v1.0/questions')
                .set('Authorization', store.auth)
                .send(inputQx)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    store.questionIds.push(res.body.id);
                    done();
                });
        };
    }

    fillQxFn(store) {
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
                    const question = { id, type: res.body.type };
                    const choices = res.body.choices;
                    if (choices) {
                        if (question.type === 'choice') {
                            question.choices = _.map(res.body.choices, choice => ({ id: choice.id }));
                        } else {
                            question.choices = _.map(choices, choice => ({ id: choice.id, type: choice.type }));
                        }
                    }
                    store.questions.push(question);
                    done();
                });
        };
    }

    postSurveyFn(store, survey) {
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
    }

    createSurveyFn(store, qxIndices) {
        const generator = this.generator;
        return function (done) {
            const inputSurvey = generator.newSurvey();
            inputSurvey.questions = qxIndices.map(index => ({
                id: store.questionIds[index],
                required: false
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
    }

    createSurveyProfileFn(store, survey) {
        return function (done) {
            store.server
                .post('/api/v1.0/profile-survey')
                .set('Authorization', store.auth)
                .send(survey)
                .expect(201)
                .expect(function (res) {
                    expect(!!res.body.id).to.equal(true);
                })
                .end(done);
        };
    }

    createConsentTypeFn(store, history) {
        const generator = this.generator;
        return function (done) {
            const cst = generator.newConsentType();
            store.server
                .post('/api/v1.0/consent-types')
                .set('Authorization', store.auth)
                .send(cst)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.pushType(cst, res.body);
                    done();
                });
        };
    }

    createConsentDocumentFn(store, history, typeIndex) {
        const generator = this.generator;
        return function (done) {
            const typeId = history.typeId(typeIndex);
            const cs = generator.newConsentDocument({ typeId });
            store.server
                .post(`/api/v1.0/consent-documents`)
                .set('Authorization', store.auth)
                .send(cs)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.push(typeIndex, cs, res.body);
                    done();
                });
        };
    }
}

module.exports = SharedIntegration;
