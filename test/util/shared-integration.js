/* global it*/

'use strict';

const chai = require('chai');

const appgen = require('../../app-generator');
const db = require('../../models/db');
const Generator = require('./generator');
const translator = require('./translator');
const comparator = require('./comparator');

const expect = chai.expect;

class SharedIntegration {
    constructor(generator) {
        this.generator = generator || new Generator();
    }

    setUpFn(store, options = {}) {
        return function (done) {
            const app = appgen.newExpress();
            appgen.initialize(app, options, (err, app) => {
                if (err) {
                    return done(err);
                }
                store.initialize(app);
                return done();
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
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.push(clientSurvey, res.body);
                    return done();
                });
        };
    }

    verifyProfileSurveyFn(store, hxSurvey, index) {
        return function (done) {
            store.get('/profile-survey', false, 200)
                .expect((res) => {
                    expect(res.body.exists).to.equal(true);
                    const survey = res.body.survey;
                    const id = hxSurvey.id(index);
                    expect(survey.id).to.equal(id);
                    hxSurvey.updateServer(index, survey);
                    comparator.survey(hxSurvey.client(index), survey);
                })
                .end(done);
        };
    }

    createUserFn(store, history, user, override) {
        const generator = this.generator;
        return function (done) {
            if (!user) {
                user = generator.newUser(override);
            }
            store.post('/users', user, 201)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    history.push(user, { id: res.body.id });
                    return done();
                });
        };
    }

    createSurveyFn(store, hxSurvey, hxQuestion, qxIndices) {
        const generator = this.generator;
        return function (done) {
            const inputSurvey = generator.newSurvey();
            delete inputSurvey.sections;
            if (hxQuestion) {
                inputSurvey.questions = qxIndices.map(index => ({
                    id: hxQuestion.server(index).id,
                    required: false,
                }));
            }
            store.post('/surveys', inputSurvey, 201)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.push(inputSurvey, res.body);
                    return done();
                });
        };
    }

    createSurveyProfileFn(store, survey) {
        return function (done) {
            store.post('/profile-survey', survey, 201)
                .expect((res) => {
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
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    history.pushType(cst, res.body);
                    return done();
                });
        };
    }

    createConsentFn(store, hxConsent, hxConsentDocument, typeIndices) {
        const generator = this.generator;
        return function (done) {
            const sections = typeIndices.map(typeIndex => hxConsentDocument.typeId(typeIndex));
            const clientConsent = generator.newConsent({ sections });
            store.post('/consents', clientConsent, 201)
                .expect((res) => {
                    hxConsent.pushWithId(clientConsent, res.body.id);
                })
                .end(done);
        };
    }

    verifyConsentFn(store, hxConsent, index) {
        return function (done) {
            const id = hxConsent.id(index);
            store.get(`/consents/${id}`, true, 200)
                .expect((res) => {
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
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    history.push(typeIndex, cs, res.body);
                    return done();
                });
        };
    }

    translateConsentTypeFn(store, index, language, hxType) {
        return function (done) {
            const server = hxType.server(index);
            const translation = translator.translateConsentType(server, language);
            store.patch(`/consent-types/text/${language}`, translation, 204)
                .end((err) => {
                    if (err) {
                        return done(err);
                    }
                    hxType.translate(index, language, translation);
                    return done();
                });
        };
    }

    translateConsentDocumentFn(store, index, language, history) {
        return function (done) {
            const server = history.server(index);
            const translation = translator.translateConsentDocument(server, language);
            store.patch(`/consent-documents/text/${language}`, translation, 204)
                .end((err) => {
                    if (err) {
                        return done(err);
                    }
                    history.hxDocument.translateWithServer(server, language, translation);
                    return done();
                });
        };
    }

    verifyUserAudit(store) {
        it('verify user audit', () => {
            const userAudit = store.getUserAudit();
            return db.User.findAll({ raw: true, attributes: ['username', 'id'] })
                .then(users => new Map(users.map(user => [user.username, user.id])))
                .then(userMap => userAudit.map(({ username, operation, endpoint }) => ({ userId: userMap.get(username), operation, endpoint })))
                .then(expected => db.UserAudit.findAll({
                    raw: true,
                    attributes: ['userId', 'endpoint', 'operation'],
                    order: 'created_at',
                })
                        .then((actual) => {
                            expect(actual).to.deep.equal(expected);
                        }));
        });
    }
}

module.exports = SharedIntegration;
