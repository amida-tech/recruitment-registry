/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const SharedSpec = require('./util/shared-spec');
const comparator = require('./util/comparator');
const questionCommon = require('./util/question-common');
const surveyCommon = require('./util/survey-common');
const assessmentCommon = require('./util/assessment-common');

const expect = chai.expect;

describe('assessment answer status unit', function assessmentAnswerUnit() {
    const userCount = 3;
    const assessmentCount = 6;
    const questionCount = 8;

    const mapAnswers = new Map();
    const mapStatus = new Map();

    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxAssessment = new History();

    const questionTests = new questionCommon.SpecTests({ generator, hxQuestion });
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);
    const assessmentTests = new assessmentCommon.SpecTests(generator, hxSurvey, hxAssessment);
    // const tests = new assessmentAnswerCommon.SpecTests({
    //     generator, hxUser, hxSurvey, hxQuestion, hxAssessment,
    // });

    before(shared.setUpFn());

    _.range(userCount).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(questionCount).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 0', surveyTests.createSurveyFn({ noSection: true }));
    it('get survey 0', surveyTests.getSurveyFn(0));

    _.range(assessmentCount).forEach((index) => {
        it(`create assessment ${index}`, assessmentTests.createAssessmentFn([0]));
    });

    const verifyStatusFn = function (userIndex, assessmentIndex, expectedStatus) {
        return function verifyStatus() {
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            return models.assessmentAnswer.getAssessmentAnswersStatus({ userId, assessmentId })
                .then(status => expect(status).to.equal(expectedStatus));
        };
    };

    const verifyAssessmentAnswersFn = function (userIndex, assessmentIndex, status) {
        return function verifyAssessmentAnswers() {
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            return models.assessmentAnswer.getAssessmentAnswers({ userId, assessmentId })
                .then((result) => {
                    const expected = mapAnswers.get(assessmentIndex) || [];
                    expect(result.status).to.equal(status);
                    comparator.answers(expected, result.answers);
                });
        };
    };

    const createAssessmentAnswersFullFn = function (userIndex, assessmentIndex, status) {
        return function createAssessmentAnswersFul() {
            const survey = hxSurvey.server(0);
            const answers = generator.answerQuestions(survey.questions);
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status,
                userId,
                assessmentId,
            };
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(() => mapAnswers.set(assessmentIndex, answers))
                .then(() => mapStatus.set(assessmentIndex, status));
        };
    };

    const createAssessmentAnswersPartialFn = function (userIndex, assessmentIndex) {
        return function answerSurveyPartial() {
            const survey = hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'in-progress',
                userId,
                assessmentId,
            };
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(() => mapAnswers.set(assessmentIndex, answers))
                .then(() => mapStatus.set(assessmentIndex, 'in-progress'));
        };
    };

    const createAssessmentAnswersPartialCompletedFn = function (userIndex, assessmentIndex) {
        return function createAssessmentAnswersPartialCompleted() {
            const survey = hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'completed',
                userId,
                assessmentId,
            };
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        };
    };

    const createAssessmentAnswersMissingPlusCompletedFn = function (userIndex, assessmentIndex) {
        return function createAssessmentAnswersMissingPlusCompleted() {
            const survey = hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const notRequiredQuestions = survey.questions.filter(question => !question.required);
            expect(notRequiredQuestions).to.have.length.above(0);
            const questions = [...requiredQuestions, notRequiredQuestions[0]];
            const answers = generator.answerQuestions(questions);
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'completed',
                userId,
                assessmentId,
            };
            const key = assessmentIndex;
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(() => {
                    const qxIdsNewlyAnswered = new Set(answers.map(answer => answer.questionId));
                    const previousAnswers = mapAnswers.get(assessmentIndex).filter(answer => !qxIdsNewlyAnswered.has(answer.questionId));
                    mapAnswers.set(key, [...previousAnswers, ...answers]);
                })
                .then(() => mapStatus.set(key, 'completed'));
        };
    };

    _.range(3).forEach((index) => {
        it(`verify assessment answer ${index} status`, verifyStatusFn(index, index, 'new'));
        it(`verify assessment answer ${3 + index} status`, verifyStatusFn(index, 3 + index, 'new'));
    });

    _.range(3).forEach((index) => {
        it(`verify assessment answer ${index}`, verifyAssessmentAnswersFn(index, index, 'new'));
        it(`verify assessment answer ${3 + index}`, verifyAssessmentAnswersFn(index, 3 + index, 'new'));
    });

    it('user 0 creates assessment 0 (completed)', createAssessmentAnswersFullFn(0, 0, 'completed'));
    it('verify assessment 0 status', verifyStatusFn(0, 0, 'completed'));
    it('verify assessment 0 answers', verifyAssessmentAnswersFn(0, 0, 'completed'));

    it('user 1 creates assessment 1 (in progress)', createAssessmentAnswersFullFn(1, 1, 'in-progress'));
    it('verify assessment 1 status', verifyStatusFn(1, 1, 'in-progress'));
    it('verify assessment 1 answers', verifyAssessmentAnswersFn(1, 1, 'in-progress'));

    it('user 2 modifies assessment 1 (in-progress)', createAssessmentAnswersFullFn(2, 1, 'in-progress'));
    it('verify assessment 1 status', verifyStatusFn(1, 1, 'in-progress'));
    it('verify assessment 1 answers', verifyAssessmentAnswersFn(1, 1, 'in-progress'));

    it('user 2 creates assessment 2 (in-progress)', createAssessmentAnswersPartialFn(2, 2));
    it('verify assessment 2 status', verifyStatusFn(0, 1, 'in-progress'));
    it('verify assessment 2 answers', verifyAssessmentAnswersFn(2, 2, 'in-progress'));

    it('error: user 0 creates assessment 3 partial (completed)', createAssessmentAnswersPartialCompletedFn(0, 3));
    it('verify assessment 3 status', verifyStatusFn(0, 3, 'new'));
    it('verify assessment 3 status', verifyAssessmentAnswersFn(0, 3, 'new'));

    it('user 2 completes assessment 2 (completed)', createAssessmentAnswersMissingPlusCompletedFn(2, 2));
    it('verify assessment 2 status', verifyStatusFn(2, 2, 'completed'));
    it('verify assessment 2 status', verifyAssessmentAnswersFn(2, 2, 'completed'));
});
