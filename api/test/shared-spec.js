'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const registryExamaples = require('./fixtures/registry-examples');
const RRError = require('../lib/rr-error');

const expect = chai.expect;

exports.setUpFn = function () {
    return function () {
        return models.sequelize.sync({
            force: true
        });
    };
};

exports.genNewUser = (function () {
    let index = -1;

    return function (override) {
        ++index;
        let user = {
            username: 'username_' + index,
            password: 'password_' + index,
            email: 'email_' + index + '@example.com'
        };
        if (override) {
            user = _.assign(user, override);
        }
        return user;
    };
})();

exports.createUser = function (store) {
    return function () {
        const inputUser = exports.genNewUser();
        return models.User.create(inputUser)
            .then(function (user) {
                store.userIds.push(user.id);
            });
    };
};

exports.genNewQuestion = (function () {
    const types = ['text', 'choice', 'choices', 'bool'];
    let index = -1;
    let choiceIndex = 1;
    let choicesTextSwitch = false;

    return function () {
        ++index;
        const type = types[index % 4];
        const question = {
            text: `text_${index}`,
            type,
            selectable: (index % 2 === 0)
        };
        if ((type === 'choice') || (type === 'choices')) {
            question.choices = [];
            ++choiceIndex;
            if (type === 'choices') {
                choicesTextSwitch = !choicesTextSwitch;
            }
            for (let i = choiceIndex; i < choiceIndex + 5; ++i) {
                const choice = { text: `choice_${i}` };
                if ((type === 'choices') && choicesTextSwitch && (i === choiceIndex + 4)) {
                    choice.type = 'text';
                }
                question.choices.push(choice);
            }
        }
        return question;
    };
})();

exports.createQuestion = function (store) {
    return function () {
        const inputQx = exports.genNewQuestion();
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
                                qx.choices = _.map(choices, 'id');
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

exports.genNewSurvey = (function () {
    let index = -1;
    const defaultOptions = {
        released: true,
        addQuestions: true
    };
    return function (inputOptions = {}) {
        const options = Object.assign({}, defaultOptions, inputOptions);
        ++index;
        const result = { name: `name_${index}` };
        result.released = options.released;
        if (options.addQuestions) {
            result.questions = _.range(5).map(() => ({ content: exports.genNewQuestion() }));
        }
        return result;
    };
})();

exports.createSurvey = function (store, qxIndices) {
    return function () {
        const inputSurvey = exports.genNewSurvey({ addQuestions: false });
        inputSurvey.questions = qxIndices.map(index => ({
            id: store.questions[index].id
        }));
        return models.Survey.createSurvey(inputSurvey)
            .then(id => {
                store.surveys.push(id);
            });
    };
};

exports.createRegistry = function (store) {
    return function () {
        const inputRegistry = registryExamaples[0];
        return models.Registry.createRegistry(inputRegistry)
            .then(() => store.registryName = inputRegistry.name);
    };
};

exports.createDocumentTypeFn = (function () {
    let index = -1;

    return function (store) {
        return function () {
            ++index;
            const docType = {
                name: `type_${index}`,
                description: `description_${index}`
            };
            return models.DocumentType.createDocumentType(docType)
                .then(({ id }) => {
                    const newDocType = Object.assign({}, docType, { id });
                    store.documentTypes.push(newDocType);
                    store.activeDocuments.push(null);
                });
        };
    };
})();

exports.createDocumentFn = (function () {
    let index = -1;

    return function (store, typeIndex) {
        return function () {
            ++index;
            const typeId = store.documentTypes[typeIndex].id;
            const doc = {
                typeId,
                content: `Sample document content ${index}`
            };
            store.clientDocuments.push(doc);
            return models.Document.createDocument(doc)
                .then(({ id }) => {
                    const docToStore = Object.assign({}, doc, { id });
                    store.documents.push(docToStore);
                    store.activeDocuments[typeIndex] = docToStore;
                });
        };
    };
})();

exports.throwingHandler = function () {
    throw new Error('Unexpected no error.');
};

exports.expectedErrorHandler = function (code) {
    return function (err) {
        expect(err).to.be.instanceof(RRError);
        expect(err.code).to.equal(code);
        expect(!!err.message).to.equal(true);
    };
};
