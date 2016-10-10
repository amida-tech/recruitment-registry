'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const RRError = require('../../lib/rr-error');
const Generator = require('./entity-generator');

const expect = chai.expect;
const entityGen = new Generator();

exports.setUpFn = function () {
    return function () {
        return models.sequelize.sync({
            force: true
        });
    };
};

exports.createUser = function (store) {
    return function () {
        const inputUser = entityGen.newUser();
        return models.User.create(inputUser)
            .then(function (user) {
                store.userIds.push(user.id);
            });
    };
};

exports.createQuestion = function (store) {
    return function () {
        const inputQx = entityGen.newQuestion();
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
                store.questions.push(qx);
            });
    };
};

exports.createSurvey = function (store, qxIndices) {
    return function () {
        const inputSurvey = entityGen.newSurvey();
        inputSurvey.questions = qxIndices.map(index => ({
            id: store.questions[index].id,
            required: false
        }));
        return models.Survey.createSurvey(inputSurvey)
            .then(id => {
                store.surveys.push(id);
            });
    };
};

exports.createConsentSectionTypeFn = function (store) {
    return function () {
        const cst = entityGen.newConsentSectionType();
        return models.ConsentSectionType.createConsentSectionType(cst)
            .then(({ id }) => {
                const newDocType = Object.assign({}, cst, { id });
                store.consentSectionTypes.push(newDocType);
                store.activeConsentSections.push(null);
            });
    };
};

exports.createConsentSectionFn = (function () {
    let index = -1;

    return function (store, typeIndex) {
        return function () {
            ++index;
            const typeId = store.consentSectionTypes[typeIndex].id;
            const doc = {
                typeId,
                content: `Sample consent section content ${index}`
            };
            store.clientConsentSections.push(doc);
            return models.ConsentSection.createConsentSection(doc)
                .then(({ id }) => {
                    const docToStore = Object.assign({}, doc, { id });
                    store.consentSections.push(docToStore);
                    store.activeConsentSections[typeIndex] = docToStore;
                });
        };
    };
})();

exports.signConsentSectionTypeFn = function (store, userIndex, typeIndex) {
    return function () {
        const consentSectionId = store.activeConsentSections[typeIndex].id;
        const userId = store.userIds[userIndex];
        store.signatures[userIndex].push(consentSectionId);
        return models.ConsentSectionSignature.createSignature(userId, consentSectionId);
    };
};

exports.throwingHandler = function () {
    throw new Error('Unexpected no error.');
};

exports.expectedErrorHandler = function (code) {
    return function (err) {
        expect(err).to.be.instanceof(RRError);
        expect(err.code).to.equal(code);
        expect(!!err.message).to.equal(true);
        return err;
    };
};
