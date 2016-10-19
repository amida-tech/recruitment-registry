'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const QuestionChoice = models.QuestionChoice;
const QuestionAction = models.QuestionAction;

const expect = chai.expect;

const comparator = {
    question(client, server) {
        const expected = _.cloneDeep(client);
        const actual = _.cloneDeep(server);
        if (expected.type === 'choices') {
            expected.choices.forEach((choice) => choice.type = choice.type || 'bool');
        }
        if (expected.type === 'choice' && expected.oneOfChoices) {
            expected.choices = expected.oneOfChoices.map(choice => ({ text: choice }));
            delete expected.oneOfChoices;
        }
        delete actual.id;
        if (actual.choices) {
            actual.choices.forEach(choice => delete choice.id);
        }
        if (actual.actions) {
            actual.actions.forEach(action => delete action.id);
        }
        expect(actual).to.deep.equal(expected);
    },
    questions(client, server) {
        const n = client.length;
        expect(n).to.equal(server.length);
        for (let i = 0; i < n; ++i) {
            comparator.question(client[i], server[i]);
        }
    },
    questionXL(client, server) {
        const id = server.id;
        const expected = _.cloneDeep(client);
        if (expected.type === 'choices') {
            expected.choices.forEach((choice) => choice.type = choice.type || 'bool');
        }
        if (expected.type === 'choice' && expected.oneOfChoices) {
            expected.choices = expected.oneOfChoices.map(choice => ({ text: choice }));
            delete expected.oneOfChoices;
        }
        expected.id = id;
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
            .then(() => expect(server).to.deep.equal(expected));
    },
    questionsXL(client, server) {
        const n = client.length;
        expect(n).to.equal(server.length);
        const pxs = _.range(n).map(i => this.questionXL(client[i], server[i]));
        return models.sequelize.Promise.all(pxs);
    },
    survey(client, server) {
        const expected = _.cloneDeep(client);
        const actual = _.cloneDeep(server);
        expected.id = actual.id;
        return this.questionsXL(expected.questions, actual.questions)
            .then(() => {
                delete expected.questions;
                delete actual.questions;
                expect(actual).to.deep.equal(expected);
            });
    }
};

module.exports = comparator;
