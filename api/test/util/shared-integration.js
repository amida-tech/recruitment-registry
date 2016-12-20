'use strict';

const request = require('supertest');
const chai = require('chai');
const _ = require('lodash');

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
                store.initialize(request(app));
                done();
            });
        };
    }

    loginFn(store, login) {
        return function (done) {
            store.authBasic(login).end(done);
        };
    }

    loginIndexFn(store, history, index) {
        const shared = this;
        return function (done) {
            const login = history.client(index);
            login.username = login.username || login.email.toLowerCase();
            shared.loginFn(store, login)(done);
        };
    }

    logoutFn(store) {
        return function () {
            store.resetAuth();
        };
    }

    badLoginFn(store, login) {
        return function (done) {
            store.authBasic(login, 401).end(done);
        };
    }

    createProfileSurveyFn(store, hxSurvey) {
        const generator = this.generator;
        return function (done) {
            const clientSurvey = generator.newSurvey();
            store.post('/profile-survey', clientSurvey, 201)
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
            store.get('/profile-survey', false, 200)
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
            if (!user) {
                user = generator.newUser();
            }
            store.post('/users', user, 201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.push(user, { id: res.body.id });
                    done();
                });
        };
    }

    fillQxFn(store, hxQuestions) {
        return function (done) {
            const id = hxQuestions.lastId();
            store.get(`/questions/${id}`, true, 200)
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

    postSurveyFn(store, survey, hxSurvey) {
        return function (done) {
            store.post('/surveys', survey, 201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(!!res.body.id).to.equal(true);
                    if (hxSurvey) {
                        hxSurvey.push(survey, res.body);
                    }
                    done();
                });
        };
    }

    verifySurveyFn(store, hxSurvey, index) {
        return function (done) {
            const id = hxSurvey.id(index);
            store.get(`/surveys/${id}`, true, 200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const survey = res.body;
                    hxSurvey.updateServer(index, survey);
                    comparator.survey(hxSurvey.client(index), survey)
                        .then(done, done);
                });
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
            store.post('/surveys', inputSurvey, 201)
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
            store.post('/profile-survey', survey, 201)
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
            store.post('/consent-types', cst, 201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    history.pushType(cst, res.body);
                    done();
                });
        };
    }

    createConsentFn(store, hxConsent, hxConsentDocument, typeIndices) {
        const generator = this.generator;
        return function (done) {
            const sections = typeIndices.map(typeIndex => hxConsentDocument.typeId(typeIndex));
            const clientConsent = generator.newConsent({ sections });
            store.post('/consents', clientConsent, 201)
                .expect(function (res) {
                    hxConsent.pushWithId(clientConsent, res.body.id);
                })
                .end(done);
        };
    }

    verifyConsentFn(store, hxConsent, index) {
        return function (done) {
            const id = hxConsent.id(index);
            store.get(`/consents/${id}`, true, 200)
                .expect(function (res) {
                    const expected = hxConsent.server(index);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    }

    signConsentTypeFn(store, hxConsentDocument, userIndex, typeIndex) {
        return function (done) {
            const consentDocumentId = hxConsentDocument.id(typeIndex);
            hxConsentDocument.sign(typeIndex, userIndex);
            store.post('/consent-signatures', { consentDocumentId }, 201).end(done);
        };
    }

    bulkSignConsentTypeFn(store, hxConsentDocument, userIndex, typeIndices) {
        return function (done) {
            const consentDocumentIds = typeIndices.map(typeIndex => hxConsentDocument.id(typeIndex));
            typeIndices.forEach(typeIndex => hxConsentDocument.sign(typeIndex, userIndex));
            store.post('/consent-signatures/bulk', { consentDocumentIds }, 201).end(done);
        };
    }

    createConsentDocumentFn(store, history, typeIndex) {
        const generator = this.generator;
        return function (done) {
            const typeId = history.typeId(typeIndex);
            const cs = generator.newConsentDocument({ typeId });
            store.post('/consent-documents', cs, 201)
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
            store.patch(`/consent-types/text/${language}`, translation, 204)
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
            store.patch(`/consent-documents/text/${language}`, translation, 204)
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
