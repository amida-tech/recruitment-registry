'use strict';

const _ = require('lodash');

const models = require('../models');

const registryExamaples = require('./fixtures/registry-examples');

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
        return models.User.create(inputUser).then(function (user) {
            store.users.push(user.id);
        });
    };
};

exports.genNewQuestion = (function () {
    const types = ['text', 'choice', 'choices', 'bool', 'choicesplus'];
    let index = -1;
    let choiceIndex = 1;

    return function () {
        ++index;
        const type = types[index % 5];
        const question = {
            text: `text_${index}`,
            type
        };
        if ((type === 'choice') || (type === 'choices') || (type === 'choicesplus')) {
            question.choices = [];
            ++choiceIndex;
            for (let i = choiceIndex; i < choiceIndex + 5; ++i) {
                question.choices.push(`choice_${i}`);
            }
        }
        if (type === 'choicesplus') {
            question.additionalText = `additional_text_${index}`;
        }
        return question;
    };
})();

exports.createQuestion = function (store) {
    return function () {
        const inputQx = exports.genNewQuestion();
        const type = inputQx.type;
        return models.Question.createQuestion(inputQx).then(function (id) {
            const qx = {
                id,
                choices: null,
                type
            };
            if ((type === 'choices') || (type === 'choice') || (type === 'choicesplus')) {
                return models.QuestionChoices.findAll({
                    where: {
                        questionId: id
                    },
                    raw: true,
                    attributes: ['id']
                }).then(function (choices) {
                    qx.choices = _.map(choices, 'id');
                    return qx;
                });
            } else {
                return qx;
            }
        }).then(function (qx) {
            store.questions.push(qx);
        });
    };
};

exports.genNewSurvey = (function () {
    let index = -1;

    return function (withQuestions) {
        ++index;
        const result = { name: `name_${index}` };
        if (withQuestions) {
            result.questions = _.range(5).map(() => ({ content: exports.genNewQuestion() }));
        }
        return result;
    };
})();

exports.createSurvey = function (store, qxIndices) {
    return function () {
        const inputSurvey = exports.genNewSurvey();
        inputSurvey.questions = qxIndices.map(index => ({
            id: store.questions[index].id
        }));
        return models.Survey.createSurvey(inputSurvey).then(id => {
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
