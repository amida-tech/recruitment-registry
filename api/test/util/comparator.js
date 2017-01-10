'use strict';

const chai = require('chai');
const _ = require('lodash');

const expect = chai.expect;

let enumerationMap;

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
        if (expected.enumerationId) {
            expected.enumerals = enumerationMap.get(expected.enumerationId);
            delete expected.enumerationId;
        }
        if (expected.enumeration) {
            expected.enumerals = enumerationMap.get(expected.enumeration);
            delete expected.enumeration;
        }
        if (!expected.id) {
            expected.id = id;
        }
        delete expected.parentId;
        if (expected.type === 'choice' || expected.type === 'choices' || server.type === 'choice' || server.type === 'choices') {
            expected.choices.forEach((choice, index) => {
                choice.id = server.choices[index].id;
                if (choice.enumerationId) {
                    choice.enumerals = enumerationMap.get(choice.enumerationId);
                    delete choice.enumerationId;
                }
                if (choice.enumeration) {
                    choice.enumerals = enumerationMap.get(choice.enumeration);
                    delete choice.enumeration;
                }
            });
            expect(server.choices).to.deep.equal(expected.choices);
        }
        if (expected.actions || server.actions) {
            expected.actions.forEach((action, index) => {
                action.id = server.actions[index].id;
            });
            expect(server.actions).to.deep.equal(expected.actions);
        }
        if (expected.skip && expected.skip.rule && server.skip && server.skip.rule) {
            expected.skip.rule.id = server.skip.rule.id;
            const answer = expected.skip.rule.answer;
            if (answer && answer.choiceText) {
                const skipChoice = server.choices.find(choice => (choice.text === answer.choiceText));
                answer.choice = skipChoice.id;
                delete answer.choiceText;
            }
            if (answer && answer.choices) {
                answer.choices.forEach(answerChoice => {
                    const skipChoice = server.choices.find(choice => (choice.text === answerChoice.text));
                    answerChoice.id = skipChoice.id;
                    delete answerChoice.text;
                    if (Object.keys(answerChoice).length === 1) {
                        answerChoice.boolValue = true;
                    }
                });
                answer.choices = _.sortBy(answer.choices, 'id');
            }
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    questions(client, server) {
        expect(client.length).to.equal(server.length);
        return client.map((question, index) => this.question(question, server[index]));
    },
    survey(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        delete expected.parentId;
        if (client.sections || server.sections) {
            expect(server.sections.length).to.equal(client.sections.length);
            expected.sections.forEach((section, index) => {
                section.id = server.sections[index].id;
            });
            expect(server.sections).to.deep.equal(expected.sections);
        }
        expected.questions = this.questions(expected.questions, server.questions);
        expect(server).to.deep.equal(expected);
    },
    answeredSurvey(survey, answers, serverAnsweredSurvey, language) {
        const expected = _.cloneDeep(survey);
        const answerMap = new Map();
        answers.forEach(({ questionId, answer, answers, language }) => answerMap.set(questionId, { answer, answers, language }));
        expected.questions.forEach(qx => {
            const clientAnswers = answerMap.get(qx.id);
            if (clientAnswers) {
                if (qx.multiple) {
                    qx.answers = answerMap.get(qx.id).answers;
                } else {
                    qx.answer = answerMap.get(qx.id).answer;
                }
                qx.language = answerMap.get(qx.id).language || language || 'en';
                if (qx.type === 'choices' && qx.answer.choices) {
                    qx.answer.choices.forEach((choice) => {
                        const numValues = ['textValue', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue'].reduce((r, p) => {
                            if (choice.hasOwnProperty(p)) {
                                ++r;
                            }
                            return r;
                        }, 0);
                        if (!numValues) {
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
            if (answer.answer && answer.answer.choices) {
                answer.answer.choices.forEach((choice) => {
                    const numValues = ['textValue', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue', 'dateValue', 'numberValue', 'feetInchesValue', 'bloodPressureValue'].reduce((r, p) => {
                        if (choice.hasOwnProperty(p)) {
                            ++r;
                        }
                        return r;
                    }, 0);
                    if (!numValues) {
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
        if (!expected.hasOwnProperty('role')) {
            expected.role = 'participant';
        }
        if (!expected.username) {
            expected.username = expected.email.toLowerCase();
        }
        expect(server).to.deep.equal(expected);
    },
    enumeration(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        _.range(server.enumerals.length).forEach(index => {
            expected.enumerals[index].id = server.enumerals[index].id;
        });
        expect(server).to.deep.equal(expected);
    },
    updateEnumerationMap(enumerations) {
        enumerationMap = new Map();
        enumerations.forEach(enumeration => {
            const enumerals = enumeration.enumerals.map(({ text, value }) => ({ text, value }));
            enumerationMap.set(enumeration.id, enumerals);
            enumerationMap.set(enumeration.name, enumerals);
        });
    }
};

module.exports = comparator;
