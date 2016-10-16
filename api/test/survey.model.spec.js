/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const surveyHelper = require('./helper/survey-helper');
const models = require('../models');

const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const SharedSpec = require('./util/shared-spec');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

const Survey = models.Survey;

describe('survey unit', function () {
    before(shared.setUpFn());

    const userCount = 1;

    const history = new History();

    const hxUser = new History();

    it('verify no surveys', function () {
        return Survey.listSurveys()
            .then((surveys) => {
                expect(surveys).to.have.length(0);
            });
    });

    const createVerifySurveyFn = function (index) {
        return function () {
            const inputSurvey = generator.newSurvey();
            history.clients.push(inputSurvey);
            return Survey.createSurvey(inputSurvey)
                .then(id => Survey.getSurvey(id))
                .then((serverSurvey) => {
                    return surveyHelper.buildServerSurvey(inputSurvey, serverSurvey)
                        .then(expected => {
                            expect(serverSurvey).to.deep.equal(expected);
                            history.servers.push(serverSurvey);
                            return serverSurvey.id;
                        });
                })
                .then((id) => Survey.updateSurvey(id, { name: inputSurvey.name + 'xyz' }))
                .then(() => Survey.getSurveyByName(inputSurvey.name + 'xyz'))
                .then(serverSurvey => {
                    const updatedSurvey = Object.assign({}, inputSurvey, { name: inputSurvey.name + 'xyz' });
                    return surveyHelper.buildServerSurvey(updatedSurvey, serverSurvey)
                        .then(expected => {
                            expect(serverSurvey).to.deep.equal(expected);
                            return serverSurvey.id;
                        });
                })
                .then((id) => Survey.updateSurvey(id, { name: inputSurvey.name }))
                .then(() => Survey.listSurveys())
                .then(surveys => {
                    expect(surveys).to.have.length(index + 1);
                    const expected = history.servers.map(({ id, name }) => ({ id, name }));
                    expect(surveys).to.deep.equal(expected);
                });
        };
    };

    it('error: create survey without questions', function () {
        return Survey.createSurvey({ name: 'name' })
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNoQuestions'));
    });

    for (let i = 0; i < 8; ++i) {
        it(`create/verify/update survey ${i} and list all`, createVerifySurveyFn(i));
    }

    it('error: show a non-existent survey', function () {
        return Survey.getSurvey(999)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNotFound'));
    });

    it('error: version with a survey with no questions', function () {
        const survey = history.servers[1];
        const replacementSurvey = generator.newSurvey();
        delete replacementSurvey.questions;
        return Survey.replaceSurvey(survey.id, replacementSurvey)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNoQuestions'));
    });

    it('error: version with a non-existent survey', function () {
        const replacementSurvey = generator.newSurvey();
        return Survey.replaceSurvey(999, replacementSurvey)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNotFound'));
    });

    const replaceSurveyFn = function (index) {
        return function () {
            if (index === undefined) {
                index = history.servers.length - 1;
            }
            const survey = history.servers[index];
            const inputSurvey = generator.newSurvey();
            history.clients.push(inputSurvey);
            history.clients.splice(index, 1);
            return Survey.replaceSurvey(survey.id, inputSurvey)
                .then(id => Survey.getSurvey(id))
                .then((serverSurvey) => {
                    return surveyHelper.buildServerSurvey(inputSurvey, serverSurvey)
                        .then(expected => {
                            expect(serverSurvey).to.deep.equal(expected);
                            history.servers.push(serverSurvey);
                            history.servers.splice(index, 1);
                            return serverSurvey.id;
                        });
                })
                .then(() => Survey.listSurveys())
                .then(surveys => {
                    expect(surveys).to.have.length(history.servers.length);
                    const expected = history.servers.map(({ id, name }) => ({ id, name }));
                    expect(surveys).to.deep.equal(expected);
                });
        };
    };

    const dbVersionCompare = function (index, count) {
        const survey = history.servers[index];
        return Survey.findById(survey.id)
            .then(fullSurvey => {
                const groupId = fullSurvey.groupId;
                return Survey.findAll({
                        where: { groupId },
                        paranoid: false,
                        attributes: ['groupId', 'version'],
                        raw: true
                    })
                    .then(actual => {
                        actual = _.sortBy(actual, 'version');
                        const expected = _.range(1, count + 1).map(version => ({ version, groupId }));
                        expect(actual).to.deep.equal(expected);
                    });
            });
    };

    it('replace surveys', function () {
        return replaceSurveyFn(3)()
            .then(replaceSurveyFn(0))
            .then(replaceSurveyFn(history.servers.length - 1))
            .then(() => dbVersionCompare(history.servers.length - 1, 3))
            .then(() => dbVersionCompare(history.servers.length - 2, 2));
    });

    it('delete a survey', function () {
        const survey = history.servers[5];
        history.servers.splice(5, 1);
        history.clients.splice(5, 1);
        return Survey.deleteSurvey(survey.id)
            .then(() => Survey.listSurveys())
            .then(surveys => {
                const expected = history.servers.map(({ id, name }) => ({ id, name }));
                expect(surveys).to.deep.equal(expected);
            });
    });

    it('extract existing questions', function () {
        history.questions = _.flatten(_.map(history.servers, 'questions'));
    });

    it('survey by existing questions only', function () {
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

    it('survey by existing/new questions', function () {
        const survey = generator.newSurvey();
        const fn = index => ({ id: history.questions[index].id, required: history.questions[index].required });
        const additionalIds = [10, 11].map(fn);
        survey.questions.splice(1, 0, ...additionalIds);
        return Survey.createSurvey(survey)
            .then(id => Survey.getSurvey(id))
            .then((serverSurvey) => {
                survey.questions[1] = history.questions[10];
                survey.questions[2] = history.questions[11];
                return surveyHelper.buildServerSurvey(survey, serverSurvey)
                    .then(expected => {
                        expect(serverSurvey).to.deep.equal(expected);
                    });
            });
    });

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(hxUser));
    }

    const answerVerifySurveyFn = function (surveyIndex) {
        return function () {
            const survey = history.servers[surveyIndex];
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                userId: hxUser.id(0),
                surveyId: history.servers[1].id,
                answers
            };
            return models.Answer.createAnswers(input)
                .then(function () {
                    return Survey.getAnsweredSurveyById(input.userId, input.surveyId)
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

    it('get/verify answered survey', answerVerifySurveyFn(1));

    it('error: answer without required questions', function () {
        const survey = history.servers[3];
        const qxs = survey.questions;
        const answers = generator.answerQuestions(qxs);
        const input = {
            userId: hxUser.id(0),
            surveyId: history.servers[3].id,
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
        const survey = history.servers[0];
        const qxs = survey.questions;
        const answers = generator.answerQuestions(qxs);
        const input = {
            userId: hxUser.id(0),
            surveyId: history.servers[3].id,
            answers
        };
        answers[0].questionId = 9999;
        return models.Answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerQxNotInSurvey'));
    });
});
