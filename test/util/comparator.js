'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const expect = chai.expect;

let choiceSetMap;

const comparator = {
    enableWhen(client, server, options) {
        if (client.enableWhen && client.enableWhen.rule && server.enableWhen && server.enableWhen.rule) {
            if (client.enableWhen && (client.enableWhen.questionIndex !== undefined) && server.enableWhen && server.enableWhen.questionId) {
                client.enableWhen.questionId = server.enableWhen.questionId;
                delete client.enableWhen.questionIndex;
            }
            client.enableWhen.rule.id = server.enableWhen.rule.id;
            const answer = client.enableWhen.rule.answer;
            const question = options.serverQuestionMap[server.enableWhen.questionId];
            if (answer && answer.choiceText) {
                const enableWhenChoice = question.choices.find(choice => (choice.text === answer.choiceText));
                answer.choice = enableWhenChoice.id;
                delete answer.choiceText;
            }
            if (answer && answer.choices) {
                answer.choices.forEach(answerChoice => {
                    const enableWhenChoice = question.choices.find(choice => (choice.text === answerChoice.text));
                    answerChoice.id = enableWhenChoice.id;
                    delete answerChoice.text;
                    if (Object.keys(answerChoice).length === 1) {
                        answerChoice.boolValue = true;
                    }
                });
                answer.choices = _.sortBy(answer.choices, 'id');
            }
            const selectionTexts = client.enableWhen.rule.selectionTexts;
            if (selectionTexts) {
                client.enableWhen.rule.selectionIds = selectionTexts.map(text => question.choices.find(choice => (choice.text === text)).id);
                delete client.enableWhen.rule.selectionTexts;
            }
        }
    },
    question(client, server, options = {}) {
        const id = server.id;
        const expected = _.cloneDeep(client);
        if (expected.type === 'choices') {
            expected.choices.forEach((choice) => choice.type = choice.type || 'bool');
        }
        if (expected.type === 'choice' && expected.oneOfChoices) {
            expected.choices = expected.oneOfChoices.map(choice => ({ text: choice }));
            delete expected.oneOfChoices;
        }
        if (expected.choiceSetId) {
            expected.choices = choiceSetMap.get(expected.choiceSetId);
            delete expected.choiceSetId;
        }
        if (expected.choiceSetReference) {
            expected.choices = choiceSetMap.get(expected.choiceSetReference);
            delete expected.choiceSetReference;
        }
        if (!expected.id) {
            expected.id = id;
        }
        delete expected.parentId;
        if (options.ignoreQuestionIdentifier) {
            delete expected.questionIdentifier;
        }
        if (options.ignoreAnswerIdentifier) {
            delete expected.answerIdentifier;
            delete expected.answerIdentifiers;
        }
        if (expected.type === 'choice' || expected.type === 'choices' || server.type === 'choice' || server.type === 'choices') {
            expected.choices.forEach((choice, index) => {
                choice.id = server.choices[index].id;
                if (options.ignoreAnswerIdentifier) {
                    delete choice.answerIdentifier;
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
        if (expected.enableWhen && (expected.enableWhen.questionIndex !== undefined) && server.enableWhen && server.enableWhen.questionId) {
            expected.enableWhen.questionId = server.enableWhen.questionId;
            delete expected.enableWhen.questionIndex;
        }
        if (expected.enableWhen && expected.enableWhen.rule && server.enableWhen && server.enableWhen.rule) {
            expected.enableWhen.rule.id = server.enableWhen.rule.id;
            const answer = expected.enableWhen.rule.answer;
            if (answer && answer.choiceText) {
                const sourceQuestion = options.serverQuestionMap[server.enableWhen.questionId];
                const enableWhenChoice = sourceQuestion.choices.find(choice => (choice.text === answer.choiceText));
                answer.choice = enableWhenChoice.id;
                delete answer.choiceText;
            }
            if (answer && answer.choices) {
                answer.choices.forEach(answerChoice => {
                    const enableWhenChoice = server.choices.find(choice => (choice.text === answerChoice.text));
                    answerChoice.id = enableWhenChoice.id;
                    delete answerChoice.text;
                    if (Object.keys(answerChoice).length === 1) {
                        answerChoice.boolValue = true;
                    }
                });
                answer.choices = _.sortBy(answer.choices, 'id');
            }
            const selectionTexts = expected.enableWhen.rule.selectionTexts;
            if (selectionTexts) {
                expected.enableWhen.rule.selectionIds = selectionTexts.map(text => server.choices.find(choice => (choice.text === text)).id);
                delete expected.enableWhen.rule.selectionTexts;
            }
        }
        if (expected.section && server.section) {
            expected.section.id = server.section.id;
            this.enableWhen(expected.section, server.section, options);
            this.surveySectionsOrQuestions(expected.section, server.section, options);
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    questions(client, server, options = {}) {
        expect(client.length).to.equal(server.length);
        return client.map((question, index) => this.question(question, server[index], options));
    },
    surveySections(clientSections, serverSections, options) {
        expect(serverSections.length).to.equal(clientSections.length);
        clientSections.forEach((section, index) => {
            const serverSection = serverSections[index];
            section.id = serverSection.id;
            expect(section.name).to.equal(serverSection.name);
            expect((section.sections && serverSection.sections) || (section.questions && serverSection.questions));
            if (section.questions) {
                section.questions = this.questions(section.questions, serverSection.questions, options);
            }
            if (section.sections) {
                this.surveySections(section.sections, serverSection.sections, options);
            }
        });
    },
    surveySectionsOrQuestions(client, server, options) {
        expect(!((client.sections && server.sections) || (client.questions && server.questions))).to.equal(false);
        expect(!((client.sections && client.questions) || (server.sections && server.questions))).to.equal(true);
        if (client.sections) {
            this.surveySections(client.sections, server.sections, options);
        } else {
            client.questions = this.questions(client.questions, server.questions, options);
        }
    },
    survey(client, server, options = {}) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        delete expected.parentId;
        if (options.ignoreSurveyIdentifier) {
            delete expected.identifier;
        }
        if (!expected.status) {
            expected.status = 'published';
        }
        const serverSurveyQuestions = models.survey.getQuestions(server);
        const serverQuestionMap = _.keyBy(serverSurveyQuestions, 'id');
        options.serverQuestionMap = serverQuestionMap;
        this.surveySectionsOrQuestions(expected, server, options);
        expect(server).to.deep.equal(expected);
    },
    answeredSurvey(survey, answers, serverAnsweredSurvey, language) {
        const expected = _.cloneDeep(survey);
        const answerMap = new Map();
        answers.forEach(({ questionId, answer, answers, language }) => answerMap.set(questionId, { answer, answers, language }));
        const surveyQuestions = models.survey.getQuestions(expected);
        surveyQuestions.forEach(qx => {
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
                        const numValues = ['textValue', 'code', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue'].reduce((r, p) => {
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
                    const numValues = ['textValue', 'code', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue', 'dateValue', 'numberValue', 'feetInchesValue', 'bloodPressureValue'].reduce((r, p) => {
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
    choiceSet(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        _.range(server.choices.length).forEach(index => {
            expected.choices[index].id = server.choices[index].id;
        });
        expect(server).to.deep.equal(expected);
    },
    conditionalSurveyTwiceCreated(firstServer, secondServer) {
        secondServer.questions.forEach((question, index) => {
            const ruleId = _.get(question, 'skip.rule.id');
            if (ruleId) {
                const newRuleId = firstServer.questions[index].skip.rule.id;
                question.skip.rule.id = newRuleId;
            }
        });
        secondServer.questions.forEach((question, index) => {
            const ruleId = _.get(question, 'enableWhen.rule.id');
            if (ruleId) {
                const newRuleId = firstServer.questions[index].enableWhen.rule.id;
                question.enableWhen.rule.id = newRuleId;
            }
        });
        secondServer.questions.forEach((question, index) => {
            const id = _.get(question, 'section.id');
            if (id) {
                const newId = firstServer.questions[index].section.id;
                question.section.id = newId;
            }
        });
        secondServer.questions.forEach((question, index) => {
            const ruleId = _.get(question, 'section.enableWhen.rule.id');
            if (ruleId) {
                const newRuleId = firstServer.questions[index].section.enableWhen.rule.id;
                question.section.enableWhen.rule.id = newRuleId;
            }
        });
        delete firstServer.sections;
        expect(secondServer).to.deep.equal(firstServer);
    },
    updateChoiceSetMap(choiceSets) {
        choiceSetMap = new Map();
        choiceSets.forEach(choiceSet => {
            const choices = choiceSet.choices.map(({ id, text, code }) => ({ id, text, code }));
            choiceSetMap.set(choiceSet.id, choices);
            choiceSetMap.set(choiceSet.reference, choices);
        });
    }
};

module.exports = comparator;
