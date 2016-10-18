'use strict';

const _ = require('lodash');

const models = require('../../models');

const QuestionChoice = models.QuestionChoice;
const QuestionAction = models.QuestionAction;

exports.buildServerQuestion = function (question, id) {
    return QuestionChoice.findChoicesPerQuestion(id)
        .then(function (result) {
            return result.reduce(function (r, choice) {
                r[choice.text] = choice.id;
                return r;
            }, {});
        })
        .then(function (choiceMap) {
            const result = _.cloneDeep(question);
            result.id = id;
            if (result.oneOfChoices) {
                result.choices = result.oneOfChoices.map(function (choice) {
                    return {
                        text: choice,
                        id: choiceMap[choice]
                    };
                });
                delete result.oneOfChoices;
            }
            if (result.choices) {
                result.choices = result.choices.map(function (choice) {
                    const choiceObj = {
                        text: choice.text,
                        id: choiceMap[choice.text]
                    };
                    if (result.type !== 'choice') {
                        choiceObj.type = choice.type || 'bool';
                    }
                    return choiceObj;
                });
            }
            return result;
        })
        .then((result) => {
            if (result.actions) {
                return QuestionAction.findActionsPerQuestion(id)
                    .then((result) => {
                        return result.reduce(function (r, action) {
                            r[action.text] = action.id;
                            return r;
                        }, {});
                    })
                    .then(function (map) {
                        if (result.actions) {
                            result.actions.forEach(action => (action.id = map[action.text]));
                        }
                        return result;
                    });
            } else {
                return result;
            }
        });
};

exports.buildServerQuestions = function (questions, ids) {
    return models.sequelize.Promise.all(_.range(0, questions.length).map(function (index) {
        if (questions[index].id) {
            return models.sequelize.Promise.resolve(questions[index]);
        } else {
            return exports.buildServerQuestion(questions[index], ids[index]);
        }
    }));
};

exports.prepareServerQuestion = function (question, clientQuestion) {
    delete question.id;
    const choices = question.choices;
    if (choices && choices.length) {
        if (clientQuestion.oneOfChoices) {
            question.oneOfChoices = _.map(choices, 'text');
            delete question.choices;
        } else {
            choices.forEach((choice) => delete choice.id);
        }
    }
    return question;
};

exports.prepareClientQuestion = function (question) {
    if (question.type === 'choices') {
        question.choices.forEach((choice) => choice.type = choice.type || 'bool');
    }
    return question;
};

exports.prepareClientQuestions = function (questions, ids, indices) {
    const testIds = _.pullAt(ids.slice(), indices);
    const samples = _.pullAt(questions.slice(), indices);
    return exports.buildServerQuestions(samples, testIds);
};
