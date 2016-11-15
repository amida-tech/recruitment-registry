'use strict';

const request = require('supertest');
const chai = require('chai');
const _ = require('lodash');

const tokener = require('../../lib/tokener');

const appgen = require('../../app-generator');
const Generator = require('./entity-generator');
const translator = require('./translator');
const comparator = require('./client-server-comparator');

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

    createProfileSurveyFn(store, hxSurvey) {
        const generator = this.generator;
        return function (done) {
            const clientSurvey = generator.newSurvey();
            store.server
                .post('/api/v1.0/profile-survey')
                .set('Authorization', store.auth)
                .send(clientSurvey)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.push(clientSurvey, res.body);
                    done();
                });
        };
    }

    verifyProfileSurveyFn(store, hxSurvey, index) {
        return function (done) {
            store.server
                .get('/api/v1.0/profile-survey')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.exists).to.equal(true);
                    const survey = res.body.survey;
                    const id = hxSurvey.id(index);
                    expect(survey.id).to.equal(id);
                    hxSurvey.updateServer(index, survey);
                    comparator.survey(hxSurvey.client(index), survey)
                        .then(done, done);
                });
        };
    }

    createUserFn(store, history, user) {
        const generator = this.generator;
        return function (done) {
            if (! user) {
                user = generator.newUser();
            }
            store.server
                .post('/api/v1.0/users')
                .set('Authorization', store.auth)
                .send(user)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    tokener.verifyJWT(res.body.token)
                        .then(result => {
                            history.push(user, { id: result.id });
                            done();
                        })
                        .catch(err => {
                            done(err);
                        });
                });
        };
    }

    createQxFn(store, hxQuestions) {
        const generator = this.generator;
        return function (done) {
            const clientQuestion = generator.newQuestion();
            store.server
                .post('/api/v1.0/questions')
                .set('Authorization', store.auth)
                .send(clientQuestion)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxQuestions.push(clientQuestion, res.body);
                    done();
                });
        };
    }

    fillQxFn(store, hxQuestions) {
        return function (done) {
            const id = hxQuestions.lastId();
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
                    hxQuestions.reloadServer(question);
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

    createSurveyFn(store, hxSurvey, hxQuestion, qxIndices) {
        const generator = this.generator;
        return function (done) {
            const inputSurvey = generator.newSurvey();
            if (hxQuestion) {
                inputSurvey.questions = qxIndices.map(index => ({
                    id: hxQuestion.server(index).id,
                    required: false
                }));
            }
            store.server
                .post('/api/v1.0/surveys')
                .set('Authorization', store.auth)
                .send(inputSurvey)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.push(inputSurvey, res.body);
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

    translateConsentTypeFn(store, index, language, hxType) {
        return function (done) {
            const server = hxType.server(index);
            const translation = translator.translateConsentType(server, language);
            store.server
                .patch(`/api/v1.0/consent-types/text/${language}`)
                .set('Authorization', store.auth)
                .send(translation)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    hxType.translate(index, language, translation);
                    done();
                });
        };
    }

    translateConsentDocumentFn(store, index, language, history) {
        return function (done) {
            const server = history.server(index);
            const translation = translator.translateConsentDocument(server, language);
            store.server
                .patch(`/api/v1.0/consent-documents/text/${language}`)
                .set('Authorization', store.auth)
                .send(translation)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    history.hxDocument.translateWithServer(server, language, translation);
                    done();
                });
        };
    }

}

module.exports = SharedIntegration;
