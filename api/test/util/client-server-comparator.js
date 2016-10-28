'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const QuestionChoice = models.QuestionChoice;
const QuestionAction = models.QuestionAction;

const expect = chai.expect;

const comparator = {
    question(client, server) {
        const id = server.id;
        const expected = _.cloneDeep(client);
        if (expected.type === 'choices') {
            expected.choices.forEach((choice) => choice.type = choice.type || 'bool');
        }
        if (expected.type === 'choice' && expected.oneOfChoices) {
            expected.choices = expected.oneOfChoices.map(choice => ({ text: choice }));
            delete expected.oneOfChoices;
        }
        if (!expected.id) {
            expected.id = id;
        }
        return QuestionChoice.findChoicesPerQuestion(id)
            .then(choices => {
                return choices.reduce(function (r, choice) {
                    r[choice.text] = choice.id;
                    return r;
                }, {});
            })
            .then(choiceMap => {
                if (expected.oneOfChoices) {
                    expected.choices = expected.oneOfChoices.map(function (choice) {
                        return {
                            text: choice,
                            id: choiceMap[choice]
                        };
                    });
                    delete expected.oneOfChoices;
                }
                if (expected.choices) {
                    expected.choices = expected.choices.map(function (choice) {
                        const choiceObj = {
                            text: choice.text,
                            id: choiceMap[choice.text]
                        };
                        if (expected.type !== 'choice') {
                            choiceObj.type = choice.type || 'bool';
                        }
                        return choiceObj;
                    });
                }
            })
            .then(() => {
                if (expected.actions) {
                    return QuestionAction.findActionsPerQuestion(id)
                        .then((expected) => {
                            return expected.reduce(function (r, action) {
                                r[action.text] = action.id;
                                return r;
                            }, {});
                        })
                        .then(function (map) {
                            if (expected.actions) {
                                expected.actions.forEach(action => (action.id = map[action.text]));
                            }
                            return expected;
                        });
                } else {
                    return expected;
                }
            })
            .then(() => {
                expect(server).to.deep.equal(expected);
            });
    },
    questions(client, server) {
        const n = client.length;
        expect(n).to.equal(server.length);
        const pxs = _.range(n).map(i => this.question(client[i], server[i]));
        return models.sequelize.Promise.all(pxs)
            .then(() => {});
    },
    survey(client, server) {
        const expected = _.cloneDeep(client);
        const actual = _.cloneDeep(server);
        expected.id = actual.id;
        return this.questions(expected.questions, actual.questions)
            .then(() => {
                delete expected.questions;
                delete actual.questions;
                if (actual.sections) {
                    actual.sections.forEach(section => delete section.id);
                }
                expect(actual).to.deep.equal(expected);
            });
    },
    answeredSurvey(survey, answers, server) {
        const expected = _.cloneDeep(survey);
        expected.questions.forEach((qx, index) => {
            qx.answer = answers[index].answer;
            if (qx.type === 'choices' && qx.answer.choices) {
                qx.answer.choices.forEach((choice) => {
                    if (!choice.textValue && !choice.hasOwnProperty('boolValue')) {
                        choice.boolValue = true;
                    }
                });
            }
        });
        expect(server).to.deep.equal(expected);
    },
    user(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        delete expected.password;
        expect(server).to.deep.equal(expected);
    }
};

module.exports = comparator;
