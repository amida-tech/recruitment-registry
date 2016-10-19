/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const SharedSpec = require('./util/shared-spec');
const comparator = require('./util/client-server-comparator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

const Survey = models.Survey;

describe('survey unit', function () {
    before(shared.setUpFn());

    const userCount = 1;
    const surveyCount = 8;

    const history = new History(['id', 'name']);
    const hxUser = new History();

    it('verify no surveys', function () {
        return Survey.listSurveys()
            .then((surveys) => {
                expect(surveys).to.have.length(0);
            });
    });

    const createVerifySurveyFn = function (index) {
        return function () {
            const clientSurvey = generator.newSurvey();
            const updatedName = clientSurvey.name + 'xyz';
            return Survey.createSurvey(clientSurvey)
                .then(id => Survey.getSurvey(id))
                .then((serverSurvey) => {
                    return comparator.survey(clientSurvey, serverSurvey)
                        .then(() => {
                            history.push(clientSurvey, serverSurvey);
                            return serverSurvey.id;
                        });
                })
                .then((id) => Survey.updateSurveyText({ id, name: updatedName }))
                .then(() => Survey.getSurveyByName(updatedName))
                .then(serverSurvey => {
                    const updatedSurvey = Object.assign({}, clientSurvey, { name: updatedName });
                    return comparator.survey(updatedSurvey, serverSurvey)
                        .then(() => serverSurvey.id);
                })
                .then((id) => Survey.updateSurveyText({ id, name: clientSurvey.name }))
                .then(() => Survey.listSurveys())
                .then(surveys => {
                    expect(surveys).to.have.length(index + 1);
                    const expected = history.listServers().map(({ id, name }) => ({ id, name }));
                    expect(surveys).to.deep.equal(expected);
                });
        };
    };

    it('error: create survey without questions', function () {
        return Survey.createSurvey({ name: 'name' })
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNoQuestions'));
    });

    for (let i = 0; i < surveyCount; ++i) {
        it(`create/get/verify/update survey ${i} and list all`, createVerifySurveyFn(i));
    }

    it('error: show a non-existent survey', function () {
        return Survey.getSurvey(999)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNotFound'));
    });

    it('error: show a non-existent survey by name', function () {
        return Survey.getSurveyByName('NotHere')
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNotFound'));
    });

    it('error: replace with a survey with no questions', function () {
        const survey = history.server(1);
        const replacementSurvey = generator.newSurvey();
        delete replacementSurvey.questions;
        return Survey.replaceSurvey(survey.id, replacementSurvey)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNoQuestions'));
    });

    it('error: replace a non-existent survey', function () {
        const replacementSurvey = generator.newSurvey();
        return Survey.replaceSurvey(999, replacementSurvey)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNotFound'));
    });

    it('get survey 3 in spanish when no name translation', function () {
        const survey = history.server(3);
        return Survey.getSurvey(survey.id, { language: 'es' })
            .then(result => {
                expect(result).to.deep.equal(survey);
            });
    });

    it('list surveys in spanish when no translation', function () {
        return Survey.listSurveys({ language: 'es' })
            .then(result => {
                const list = history.listServers();
                expect(result).to.deep.equal(list);
            });
    });

    const translateTextFn = function (index, language) {
        return function () {
            const { name } = generator.newSurvey();
            const id = history.id(index);
            return Survey.updateSurveyText({ id, name }, language)
                .then(() => {
                    history.translate(index, language, { name });
                });
        };
    };

    const getTranslatedFn = function (index, language) {
        return function () {
            const id = history.id(index);
            return Survey.getSurvey(id, { language })
                .then(result => {
                    const expected = history.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const listTranslatedFn = function (language) {
        return function () {
            return Survey.listSurveys({ language })
                .then(result => {
                    const expected = history.listTranslatedServers(language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    for (let i = 0; i < surveyCount; i += 2) {
        it(`add translated name to survey ${i}`, translateTextFn(i, 'es'));
        it(`get and verify tanslated survey ${i}`, getTranslatedFn(i, 'es'));
    }

    it('list and verify translated surveys', listTranslatedFn('es'));

    it('list surveys in english (original)', function () {
        return Survey.listSurveys({ language: 'en' })
            .then(result => {
                const list = history.listServers();
                expect(result).to.deep.equal(list);
            });
    });

    const replaceSurveyFn = function (index) {
        return function () {
            const id = history.id(index);
            const clientSurvey = generator.newSurvey();
            return Survey.replaceSurvey(id, clientSurvey)
                .then(id => Survey.getSurvey(id))
                .then((serverSurvey) => {
                    return comparator.survey(clientSurvey, serverSurvey)
                        .then(() => {
                            history.replace(index, clientSurvey, serverSurvey);
                            return serverSurvey.id;
                        });
                })
                .then(() => Survey.listSurveys())
                .then(surveys => {
                    const expected = history.listServers();
                    expect(surveys).to.deep.equal(expected);
                });
        };
    };

    const dbVersionCompareFn = function (index, count) {
        return function () {
            const id = history.id(index);
            return Survey.getSurvey(id, { override: { attributes: ['id', 'groupId'] } })
                .then(surveyWithGroupId => {
                    const groupId = surveyWithGroupId.groupId;
                    return Survey.listSurveys({
                            override: {
                                where: { groupId },
                                paranoid: false,
                                attributes: ['groupId', 'version'],
                                order: 'version'
                            }
                        })
                        .then(actual => {
                            const expected = _.range(1, count + 1).map(version => ({ version, groupId }));
                            expect(actual).to.deep.equal(expected);
                        });
                });
        };
    };

    [3, 0, 9].forEach(index => {
        it(`replace survey ${index} with survey ${surveyCount+index}`, replaceSurveyFn(index));
    });

    it('survey 1 is version 1', dbVersionCompareFn(1, 1));
    it('survey 8 is version 2', dbVersionCompareFn(8, 2));
    it('survey 10 is version 3', dbVersionCompareFn(10, 3));

    it('listSurvey override with name', function () {
        return Survey.listSurveys({
                override: {
                    where: { version: 3 },
                    paranoid: false,
                    attributes: ['id', 'name', 'version']
                }
            })
            .then(list => {
                expect(list).to.have.length(1);
                const { name, version } = list[0];
                expect(version).to.equal(3);
                const expected = history.server(10).name;
                expect(name).to.equal(expected);
            });
    });

    it('delete survey 5', function () {
        const id = history.id(5);
        history.remove(5);
        return Survey.deleteSurvey(id)
            .then(() => Survey.listSurveys())
            .then(surveys => {
                const expected = history.listServers();
                expect(surveys).to.deep.equal(expected);
            });
    });

    it('extract existing questions', function () {
        history.questions = _.flatten(_.map(history.listServers('questions'), 'questions'));
    });

    it('create survey by existing questions only', function () {
        const survey = generator.newSurvey();
        const questions = history.questions.slice(0, 10);
        survey.questions = questions.map(({ id, required }) => ({ id, required }));
        return Survey.createSurvey(survey)
            .then(id => Survey.getSurvey(id))
            .then((serverSurvey) => {
                const expected = {
                    id: serverSurvey.id,
                    name: survey.name,
                    questions: questions
                };
                expect(serverSurvey).to.deep.equal(expected);
            });
    });

    it('create survey by existing/new questions', function () {
        const survey = generator.newSurvey();
        const fn = index => ({ id: history.questions[index].id, required: history.questions[index].required });
        const additionalIds = [10, 11].map(fn);
        survey.questions.splice(1, 0, ...additionalIds);
        return Survey.createSurvey(survey)
            .then(id => Survey.getSurvey(id))
            .then((serverSurvey) => {
                survey.questions[1] = history.questions[10];
                survey.questions[2] = history.questions[11];
                return comparator.survey(survey, serverSurvey);
            });
    });

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(hxUser));
    }

    const answerVerifySurveyFn = function (surveyIndex) {
        return function () {
            const survey = history.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                userId: hxUser.id(0),
                surveyId: survey.id,
                answers
            };
            return models.Answer.createAnswers(input)
                .then(function () {
                    return Survey.getAnsweredSurvey(input.userId, input.surveyId)
                        .then(answeredSurvey => {
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
                            expect(answeredSurvey).to.deep.equal(expected);
                            return Survey.getAnsweredSurveyByName(input.userId, survey.name)
                                .then(answeredSurveyByName => {
                                    expect(answeredSurveyByName).to.deep.equal(answeredSurvey);
                                });
                        });
                });
        };
    };

    it('answer survey 1 and get/verify answered survey 1', answerVerifySurveyFn(1));

    it('error: answer without required questions', function () {
        const survey = history.server(4);
        const qxs = survey.questions;
        const answers = generator.answerQuestions(qxs);
        const input = {
            userId: hxUser.id(0),
            surveyId: survey.id,
            answers
        };
        const requiredIndices = _.range(qxs.length).filter(index => qxs[index].required);
        expect(requiredIndices).to.have.length.above(0);
        const removedAnswers = _.pullAt(answers, requiredIndices);
        let px = models.Answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        _.range(1, removedAnswers.length).forEach(index => {
            px = px
                .then(() => answers.push(removedAnswers[index]))
                .then(() => models.Answer.createAnswers(input))
                .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        });
        px = px.then(() => {
            answers.push(removedAnswers[0]);
            return models.Answer.createAnswers(input);
        });
        return px;
    });

    it('error: answer with invalid question id', function () {
        const survey = history.server(6);
        const qxs = survey.questions;
        const answers = generator.answerQuestions(qxs);
        const input = {
            userId: hxUser.id(0),
            surveyId: survey.id,
            answers
        };
        answers[0].questionId = 999;
        return models.Answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerQxNotInSurvey'));
    });
});
