'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const db = require('../../models/db');

const RRError = require('../../lib/rr-error');
const Generator = require('./entity-generator');
const translator = require('./translator');
const comparator = require('./client-server-comparator');

const expect = chai.expect;

const QuestionChoice = db.QuestionChoice;

class SharedSpec {
    constructor(generator) {
        this.generator = generator || new Generator();
    }

    setUpFn() {
        return function () {
            return models.sequelize.sync({
                force: true
            });
        };
    }

    createUserFn(hxUser) {
        const generator = this.generator;
        return function () {
            const user = generator.newUser();
            return models.user.createUser(user)
                .then(({ id }) => {
                    hxUser.push(user, { id });
                });
        };
    }

    authenticateUserFn(hxUser, index) {
        return function () {
            const client = hxUser.client(index);
            const username = client.username || client.email;
            return models.auth.authenticateUser(username, client.password);
        };
    }

    createProfileSurveyFn(hxSurvey) {
        const generator = this.generator;
        return function () {
            const survey = generator.newSurvey();
            return models.profileSurvey.createProfileSurvey(survey)
                .then(({ id }) => hxSurvey.push(survey, { id }));
        };
    }

    verifyProfileSurveyFn(hxSurvey, index) {
        return function () {
            return models.profileSurvey.getProfileSurvey()
                .then(profileSurvey => {
                    expect(profileSurvey.exists).to.equal(true);
                    const survey = profileSurvey.survey;
                    const id = hxSurvey.id(index);
                    expect(survey.id).to.equal(id);
                    hxSurvey.updateServer(index, survey);
                    return comparator.survey(hxSurvey.client(index), survey);
                });
        };
    }

    createSurveyFn(hxSurvey) {
        const generator = this.generator;
        return function () {
            const survey = generator.newSurvey();
            return models.survey.createSurvey(survey)
                .then(id => hxSurvey.push(survey, { id }));
        };
    }

    verifySurveyFn(hxSurvey, index) {
        return function () {
            const surveyId = hxSurvey.id(index);
            return models.survey.getSurvey(surveyId)
                .then(survey => {
                    return comparator.survey(hxSurvey.client(index), survey)
                        .then(() => hxSurvey.updateServer(index, survey));
                });
        };
    }

    createQuestion(hxQuestion) {
        const generator = this.generator;
        return function () {
            const inputQx = generator.newQuestion();
            const type = inputQx.type;
            return models.question.createQuestion(inputQx)
                .then(function (id) {
                    const qx = {
                        id,
                        choices: null,
                        type
                    };
                    if ((type === 'choices') || (type === 'choice')) {
                        return QuestionChoice.findAll({
                                where: {
                                    questionId: id
                                },
                                raw: true,
                                attributes: ['id', 'type']
                            })
                            .then(function (choices) {
                                if (type === 'choice') {
                                    qx.choices = _.map(choices, choice => ({ id: choice.id }));
                                } else {
                                    qx.choices = _.map(choices, choice => ({ id: choice.id, type: choice.type }));
                                }
                                return qx;
                            });
                    } else {
                        return qx;
                    }
                })
                .then(function (qx) {
                    hxQuestion.push(inputQx, qx);
                });
        };
    }

    createConsentTypeFn(history) {
        const generator = this.generator;
        return function () {
            const cst = generator.newConsentType();
            return models.consentType.createConsentType(cst)
                .then(server => history.pushType(cst, server));
        };
    }

    translateConsentTypeFn(index, language, hxType) {
        return function () {
            const server = hxType.server(index);
            const translation = translator.translateConsentType(server, language);
            return models.consentType.updateConsentTypeText(translation, language)
                .then(() => {
                    hxType.translate(index, language, translation);
                });
        };
    }

    translateConsentDocumentFn(index, language, history) {
        return function () {
            const server = history.server(index);
            const translation = translator.translateConsentDocument(server, language);
            return models.consentDocument.updateConsentDocumentText(translation, language)
                .then(() => {
                    history.hxDocument.translateWithServer(server, language, translation);
                });
        };
    }

    createConsentDocumentFn(history, typeIndex) {
        const generator = this.generator;
        return function () {
            const typeId = history.typeId(typeIndex);
            const cs = generator.newConsentDocument({ typeId });
            return models.consentDocument.createConsentDocument(cs)
                .then(server => history.push(typeIndex, cs, server));
        };
    }

    createConsentFn(hxConsent, hxConsentDocument, typeIndices) {
        const generator = this.generator;
        return function () {
            const sections = typeIndices.map(typeIndex => hxConsentDocument.typeId(typeIndex));
            const clientConsent = generator.newConsent({ sections });
            return models.consent.createConsent(clientConsent)
                .then(result => hxConsent.pushWithId(clientConsent, result.id));
        };
    }

    verifyConsentFn(hxConsent, index) {
        return function () {
            const expected = hxConsent.server(index);
            return models.consent.getConsent(expected.id)
                .then(consent => {
                    const expected = hxConsent.server(index);
                    expect(consent).to.deep.equal(expected);
                });
        };
    }

    signConsentTypeFn(history, userIndex, typeIndex) {
        return function () {
            const consentDocumentId = history.id(typeIndex);
            const userId = history.userId(userIndex);
            history.sign(typeIndex, userIndex);
            return models.consentSignature.createSignature({ userId, consentDocumentId });
        };
    }

    bulkSignConsentTypeFn(history, userIndex, typeIndices) {
        return function () {
            const consentDocumentIds = typeIndices.map(typeIndex => history.id(typeIndex));
            const userId = history.userId(userIndex);
            typeIndices.forEach(typeIndex => history.sign(typeIndex, userIndex));
            return models.consentSignature.bulkCreateSignatures(consentDocumentIds, { userId });
        };
    }

    throwingHandler() {
        throw new Error('Unexpected no error.');
    }

    expectedErrorHandler(code) {
        return function (err) {
            expect(err).to.be.instanceof(RRError);
            expect(err.code).to.equal(code);
            expect(!!err.message).to.equal(true);
            return err;
        };
    }

    expectedSeqErrorHandler(name, fields, code) {
        return function (err) {
            expect(err.name).to.equal(name);
            expect(err.fields).to.deep.equal(fields);
            if (code) {
                expect(err.message).to.equal(RRError.message(code));
            }
            return err;
        };
    }

    sanityEnoughUserTested(hxUser) {
        return function () {
            const userCount = hxUser.length();
            const counts = _.range(userCount).reduce((r, index) => {
                if (hxUser.client(index).username) {
                    ++r.username;
                } else {
                    ++r.email;
                }
                return r;
            }, { username: 0, email: 0 });
            expect(counts.username).to.be.above(0);
            expect(counts.email).to.be.above(0);
        };
    }
}

module.exports = SharedSpec;
