'use strict';

const chai = require('chai');
const _ = require('lodash');

const SPromise = require('../../lib/promise');

const models = require('../../models');

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
        delete expected.parentId;
        return models.questionChoice.findChoicesPerQuestion(id)
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
                    return models.questionAction.findActionsPerQuestion(id)
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
        return SPromise.all(pxs)
            .then(() => {});
    },
    survey(client, server) {
        const expected = _.cloneDeep(client);
        const actual = _.cloneDeep(server);
        expected.id = actual.id;
        delete expected.parentId;
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
    answeredSurvey(survey, answers, serverAnsweredSurvey, language) {
        const expected = _.cloneDeep(survey);
        const answerMap = new Map();
        answers.forEach(({ questionId, answer, language }) => answerMap.set(questionId, { answer, language }));
        expected.questions.forEach(qx => {
            const clientAnswers = answerMap.get(qx.id);
            if (clientAnswers) {
                qx.answer = answerMap.get(qx.id).answer;
                qx.language = answerMap.get(qx.id).language || language || 'en';
                if (qx.type === 'choices' && qx.answer.choices) {
                    qx.answer.choices.forEach((choice) => {
                        if (!choice.textValue && !choice.hasOwnProperty('boolValue')) {
                            choice.boolValue = true;
                        }
                    });
                }
            }
        });
        expect(serverAnsweredSurvey).to.deep.equal(expected);
    },
    answers(answers, serverAnswers, language) {
        const expected = _.cloneDeep(answers);
        expected.forEach(answer => {
            answer.language = answer.language || language || 'en';
            if (answer.answer.choices) {
                answer.answer.choices.forEach((choice) => {
                    if (!choice.textValue && !choice.hasOwnProperty('boolValue')) {
                        choice.boolValue = true;
                    }
                });
            }
        });
        const orderedExpected = _.sortBy(expected, 'questionId');
        const orderedActual = _.sortBy(serverAnswers, 'questionId');
        expect(orderedActual).to.deep.equal(orderedExpected);
    },
    user(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        delete expected.password;
        expect(server).to.deep.equal(expected);
    }
};

module.exports = comparator;
