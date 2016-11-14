/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const models = require('../models');

const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const SurveyHistory = require('./util/survey-history');
const SharedSpec = require('./util/shared-spec');
const comparator = require('./util/client-server-comparator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('user survey unit', function () {
    before(shared.setUpFn());

    const userCount = 3;
    let surveyCount = 3;

    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const mapAnswers = new Map();
    const mapStatus = new Map();

    const _key = function (userIndex, surveyIndex) {
        return `${userIndex}:${surveyIndex}`;
    };

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(hxUser));
    }

    const createSurveyFn = function () {
        return function () {
            const survey = generator.newSurvey();
            return models.survey.createSurvey(survey)
                .then(id => hxSurvey.push(survey, { id }));
        };
    };

    const verifySurveyFn = function (index) {
        return function () {
            const surveyId = hxSurvey.id(index);
            return models.survey.getSurvey(surveyId)
                .then(survey => {
                    return comparator.survey(hxSurvey.client(index), survey)
                        .then(() => hxSurvey.updateServer(index, survey));
                });
        };
    };

    for (let i = 0; i < surveyCount; ++i) {
        it(`create survey ${i}`, createSurveyFn());
        it(`get/verify survey ${i}`, verifySurveyFn(i));
    }

    const verifyStatusFn = function (userIndex, surveyIndex, expectedStatus) {
        return function () {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            return models.userSurvey.getUserSurveyStatus(userId, surveyId)
                .then(status => expect(status).to.equal(expectedStatus));
        };
    };

    it('verify user 0 survey 0 status', verifyStatusFn(0, 0, 'new'));
    it('verify user 0 survey 1 status', verifyStatusFn(0, 0, 'new'));
    it('verify user 1 survey 0 status', verifyStatusFn(0, 0, 'new'));
    it('verify user 1 survey 1 status', verifyStatusFn(0, 0, 'new'));

    const verifySurveyAnswersFn = function (userIndex, surveyIndex) {
        return function () {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            return models.survey.getAnsweredSurvey(userId, surveyId)
                .then(answeredSurvey => {
                    const survey = hxSurvey.server(surveyIndex);
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key);
                    comparator.answeredSurvey(survey, answers, answeredSurvey);
                });
        };
    };

    const answerSurveyFullFn = function (userIndex, surveyIndex, status) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                answers,
                status
            };
            const userId = hxUser.id(userIndex);
            const key = _key(userIndex, surveyIndex);
            return models.survey.answerSurvey(userId, survey.id, input)
                .then(() => mapAnswers.set(key, answers))
                .then(() => mapStatus.set(key, status));
        };
    };

    const answerSurveyPartialFn = function (userIndex, surveyIndex) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'in-progress'
            };
            const userId = hxUser.id(userIndex);
            const key = _key(userIndex, surveyIndex);
            return models.survey.answerSurvey(userId, survey.id, input)
                .then(() => mapAnswers.set(key, answers))
                .then(() => mapStatus.set(key, 'in-progress'));
        };
    };

    it('user 0 answers survey 0 all completed', answerSurveyFullFn(0, 0, 'completed'));
    it('verify user 0 survey 0 answers', verifySurveyAnswersFn(0, 0));
    it('verify user 0 survey 0 status', verifyStatusFn(0, 0, 'completed'));

    it('user 1 answers survey 1 all in-progress', answerSurveyFullFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 answers', verifySurveyAnswersFn(1, 1));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 1, 'in-progress'));

    it('user 0 answers survey 0 partial in-progress', answerSurveyPartialFn(0, 0));
    //it('verify user 0 survey 0 answers', verifySurveyAnswersFn(0, 0));
    it('verify user 0 survey 0 status', verifyStatusFn(0, 0, 'in-progress'));

    /*

    [1, 2, 7, 10, 11, 12].forEach(index => {
        it(`answer survey ${index} and get/verify answered`, answerVerifySurveyFn(index));
    });

    it('error: answer without required questions', function () {
        const survey = hxSurvey.server(4);
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
        let px = models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        _.range(1, removedAnswers.length).forEach(index => {
            px = px
                .then(() => answers.push(removedAnswers[index]))
                .then(() => models.answer.createAnswers(input))
                .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        });
        px = px.then(() => {
            answers.push(removedAnswers[0]);
            return auxAnswerVerifySurvey(survey, input);
        });
        return px;
    });

    it('reanswer without all required questions', function () {
        const survey = hxSurvey.server(4);
        const userId = hxUser.id(0);
        return models.survey.getAnsweredSurvey(userId, survey.id)
            .then(answeredSurvey => {
                const qxs = survey.questions;
                const answers = generator.answerQuestions(qxs);
                const input = {
                    userId: hxUser.id(0),
                    surveyId: survey.id,
                    answers
                };
                const requiredIndices = _.range(qxs.length).filter(index => qxs[index].required);
                expect(requiredIndices).to.have.length.above(1);
                _.pullAt(answers, requiredIndices[0]);
                return models.answer.createAnswers(input)
                    .then(() => {
                        const removedQxId = qxs[requiredIndices[0]].id;
                        const removedAnswer = answeredSurvey.questions.find(qx => (qx.id === removedQxId)).answer;
                        answers.push({ questionId: removedQxId, answer: removedAnswer });
                        return models.survey.getAnsweredSurvey(input.userId, input.surveyId)
                            .then(answeredSurvey => {
                                comparator.answeredSurvey(survey, answers, answeredSurvey);
                            });
                    });
            });
    });

    it('error: answer with invalid question id', function () {
        const survey = hxSurvey.server(6);
        const qxs = survey.questions;
        const answers = generator.answerQuestions(qxs);
        const input = {
            userId: hxUser.id(0),
            surveyId: survey.id,
            answers
        };
        answers[0].questionId = 999;
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerQxNotInSurvey'));
    });
    */
});
