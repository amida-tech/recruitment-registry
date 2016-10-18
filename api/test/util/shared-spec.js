'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const RRError = require('../../lib/rr-error');
const Generator = require('./entity-generator');
const translator = require('./translator');

const expect = chai.expect;

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

    createUser(hxUser) {
        const generator = this.generator;
        return function () {
            const clientUser = generator.newUser();
            return models.User.create(clientUser)
                .then(function (user) {
                    hxUser.push(clientUser, user);
                });
        };
    }

    createQuestion(hxQuestion) {
        const generator = this.generator;
        return function () {
            const inputQx = generator.newQuestion();
            const type = inputQx.type;
            return models.Question.createQuestion(inputQx)
                .then(function (id) {
                    const qx = {
                        id,
                        choices: null,
                        type
                    };
                    if ((type === 'choices') || (type === 'choice')) {
                        return models.QuestionChoice.findAll({
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

    createSurvey(hxSurvey, hxQuestion, qxIndices) {
        const generator = this.generator;
        return function () {
            const inputSurvey = generator.newSurvey();
            inputSurvey.questions = qxIndices.map(index => ({
                id: hxQuestion.server(index).id,
                required: false
            }));
            return models.Survey.createSurvey(inputSurvey)
                .then(id => {
                    hxSurvey.push(inputSurvey, { id });
                });
        };
    }

    createConsentTypeFn(history) {
        const generator = this.generator;
        return function () {
            const cst = generator.newConsentType();
            return models.ConsentType.createConsentType(cst)
                .then(server => history.pushType(cst, server));
        };
    }

    translateConsentTypeFn(index, language, hxType) {
        return function () {
            const server = hxType.server(index);
            const translation = translator.translateConsentType(server, language);
            return models.ConsentType.updateConsentTypeText(translation, language)
                .then(() => {
                    hxType.translate(index, language, translation);
                });
        };
    }

    translateConsentDocumentFn(index, language, hxDocument) {
        return function () {
            const server = hxDocument.server(index);
            const translation = translator.translateConsentDocument(server, language);
            return models.ConsentDocument.updateConsentDocumentText(translation, language)
                .then(() => {
                    hxDocument.translate(index, language, translation);
                });
        };
    }

    createConsentDocumentFn(history, typeIndex) {
        const generator = this.generator;
        return function () {
            const typeId = history.typeId(typeIndex);
            const cs = generator.newConsentDocument({ typeId });
            return models.ConsentDocument.createConsentDocument(cs)
                .then(server => history.push(typeIndex, cs, server));
        };
    }

    signConsentTypeFn(history, userIndex, typeIndex) {
        return function () {
            const consentDocumentId = history.id(typeIndex);
            const userId = history.userId(userIndex);
            history.sign(typeIndex, userIndex);
            return models.ConsentSignature.createSignature(userId, consentDocumentId);
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
}

module.exports = SharedSpec;
