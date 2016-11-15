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

    const verifyUserSurveyFn = function (userIndex, surveyIndex, status) {
        return function () {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            return models.userSurvey.getUserSurvey(userId, surveyId)
                .then(userSurvey => {
                    const survey = hxSurvey.server(surveyIndex);
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurvey.status).to.equal(status);
                    comparator.answeredSurvey(survey, answers, userSurvey.survey);
                });
        };
    };

    const verifyUserSurveyAnswersFn = function (userIndex, surveyIndex, status, includeSurvey) {
        return function () {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            const options = {};
            if (includeSurvey) {
                options.includeSurvey = true;
            }
            return models.userSurvey.getUserSurveyAnswers(userId, surveyId, options)
                .then(userSurveyAnswers => {
                    if (includeSurvey) {
                        const survey = hxSurvey.server(surveyIndex);
                        expect(userSurveyAnswers.survey).to.deep.equal(survey);
                    } else {
                        expect(userSurveyAnswers.survey).to.equal(undefined);
                    }
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurveyAnswers.status).to.equal(status);
                    comparator.answers(answers, userSurveyAnswers.answers);
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
            return models.userSurvey.createUserSurveyAnswers(userId, survey.id, input)
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
            return models.userSurvey.createUserSurveyAnswers(userId, survey.id, input)
                .then(() => mapAnswers.set(key, answers))
                .then(() => mapStatus.set(key, 'in-progress'));
        };
    };

    const answerSurveyMissingPlusCompletedFn = function (userIndex, surveyIndex) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const notRequiredQuestions = survey.questions.filter(question => !question.required);
            expect(notRequiredQuestions).to.have.length.above(0);
            const questions = [...requiredQuestions, notRequiredQuestions[0]];
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'completed'
            };
            const userId = hxUser.id(userIndex);
            const key = _key(userIndex, surveyIndex);
            return models.userSurvey.createUserSurveyAnswers(userId, survey.id, input)
                .then(() => {
                    const qxIdsNewlyAnswered = new Set(answers.map(answer => answer.questionId));
                    const previousAnswers = mapAnswers.get(key, answers).filter(answer => !qxIdsNewlyAnswered.has(answer.questionId));
                    mapAnswers.set(key, [...previousAnswers, ...answers]);
                })
                .then(() => mapStatus.set(key, 'completed'));
        };
    };

    const answerSurveyPartialCompletedFn = function (userIndex, surveyIndex) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'completed'
            };
            const userId = hxUser.id(userIndex);
            return models.userSurvey.createUserSurveyAnswers(userId, survey.id, input)
                .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        };

    };

    it('verify user 0 survey 0', verifyUserSurveyFn(0, 0, 'new'));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'new'));
    it('verify user 1 survey 0', verifyUserSurveyFn(1, 0, 'new'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'new'));

    it('verify user 0 survey 0 answers', verifyUserSurveyAnswersFn(0, 0, 'new'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'new'));
    it('verify user 1 survey 0 answers', verifyUserSurveyAnswersFn(1, 0, 'new'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'new'));

    it('verify user 0 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(0, 0, 'new', true));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'new', true));
    it('verify user 1 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(1, 0, 'new', true));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'new', true));

    it('user 0 answers survey 0 all completed', answerSurveyFullFn(0, 0, 'completed'));
    it('verify user 0 survey 0', verifyUserSurveyFn(0, 0, 'completed'));
    it('verify user 0 survey 0 status', verifyStatusFn(0, 0, 'completed'));
    it('verify user 0 survey 0 answers', verifyUserSurveyAnswersFn(0, 0, 'completed'));
    it('verify user 0 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(0, 0, 'completed', true));

    it('user 1 answers survey 1 all in-progress', answerSurveyFullFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'in-progress', true));

    it('user 0 answers survey 1 partial in-progress', answerSurveyPartialFn(0, 1));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'in-progress'));
    it('verify user 0 survey 1 status', verifyStatusFn(0, 1, 'in-progress'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'in-progress'));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'in-progress', true));

    it('user 1 answers survey 0 partial completed', answerSurveyPartialCompletedFn(1, 0));
    it('verify user 1 survey 0', verifyUserSurveyFn(1, 0, 'new'));
    it('verify user 1 survey 0 status', verifyStatusFn(1, 0, 'new'));
    it('verify user 1 survey 0 answers', verifyUserSurveyAnswersFn(1, 0, 'new'));
    it('verify user 1 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(1, 0, 'new', true));

    it('user 0 reanswers survey 1 required plus completed', answerSurveyMissingPlusCompletedFn(0, 1));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'completed'));
    it('verify user 0 survey 1 status', verifyStatusFn(0, 1, 'completed'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'completed'));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'completed', true));
});
