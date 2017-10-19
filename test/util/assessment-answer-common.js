'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const comparator = require('./comparator');
const AnswerHistory = require('./answer-history');
const sharedAnswer = require('./shared-answer');

const expect = chai.expect;

const SpecTests = class AnswerSpecTests {
    constructor(options) {
        this.generator = options.generator;
        this.shared = options.shared;
        this.hxUser = options.hxUser;
        this.hxSurvey = options.hxSurvey;
        this.hxQuestion = options.hxQuestion;
        this.hxAssessment = options.hxAssessment;
        this.hxAnswer = new AnswerHistory();
        this.mapAnswers = new Map();
        this.mapStatus = new Map();
    }

    createAssessmentAnswersFn(userIndex, surveyIndex, qxIndices, assessmentIndex = null) {
        const generator = this.generator;
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function createAssessmentAnswer() {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = sharedAnswer.generateAnswers(generator, survey, hxQuestion, qxIndices);
            const surveyId = survey.id;
            const input = { userId, surveyId, answers };
            const assessmentId = hxAssessment.id(assessmentIndex);
            input.assessmentId = assessmentId;
            const language = generator.nextLanguage();
            if (language) {
                input.language = language;
            }
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(() => {
                    hxAnswer.push(assessmentIndex, surveyIndex, answers, language);
                })
                .then(() => answers);
        };
    }

    getAssessmentAnswersFn(userIndex, surveyIndex, assessmentIndex = null) {
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function getAssessmentAnswers() {
            const masterId = {};
            const assessmentId = hxAssessment.id(assessmentIndex);
            Object.assign(masterId, { assessmentId });
            return models.assessmentAnswer.getAssessmentAnswersOnly(masterId)
                .then((result) => {
                    const masterIndex = assessmentIndex === null ? userIndex : assessmentIndex;
                    const expected = hxAnswer.expectedAnswers(assessmentIndex, surveyIndex);
                    comparator.answers(expected, result);
                    hxAnswer.pushServer(masterIndex, surveyIndex, result);
                });
        };
    }

    copyAssessmentAnswersFn(userIndex, surveyIndex, assessmentIndex, prevIndex) {
        const hxUser = this.hxUser;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function answerSurvey() {
            const userId = hxUser.id(userIndex);
            const assessmentId = hxAssessment.id(assessmentIndex);
            const prevAssessmentId = hxAssessment.id(prevIndex);
            const input = { userId, assessmentId, prevAssessmentId };
            return models.assessmentAnswer.copyAssessmentAnswers(input)
                .then(() => {
                    const prevExpected = hxAnswer.expectedAnswers(prevIndex, surveyIndex);
                    hxAnswer.copyAssessmentAnswers(assessmentIndex, surveyIndex, prevIndex);
                    const expected = hxAnswer.expectedAnswers(assessmentIndex, surveyIndex);
                    expect(expected).to.deep.equal(prevExpected);
                });
        };
    }

    verifyStatusFn(userIndex, assessmentIndex, expectedStatus) {
        const self = this;
        return function verifyStatus() {
            const userId = self.hxUser.id(userIndex);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            return models.assessmentAnswer.getAssessmentAnswersStatus({ userId, assessmentId })
                .then(status => expect(status).to.equal(expectedStatus));
        };
    }

    verifyAssessmentAnswersListFn(statusList, group, indices) {
        const hxAssessment = this.hxAssessment;
        return function verifyAssessmentAnswerList() {
            const options = group ? { group } : undefined;
            return models.assessmentAnswer.getAssessmentAnswersList(options)
                .then((list) => {
                    let expected = hxAssessment.listServers();
                    if (indices) {
                        expected = indices.map(index => expected[index]);
                        expected = _.cloneDeep(expected);
                    }
                    expected.forEach((r, index) => {
                        r.status = statusList[index];
                    });
                    expect(list).to.deep.equal(expected);
                });
        };
    }

    verifyAssessmentAnswersFn(userIndex, assessmentIndex, status) {
        const self = this;
        return function verifyAssessmentAnswers() {
            const userId = self.hxUser.id(userIndex);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            return models.assessmentAnswer.getAssessmentAnswers({ userId, assessmentId })
                .then((result) => {
                    const expected = self.mapAnswers.get(assessmentIndex) || [];
                    expect(result.status).to.equal(status);
                    comparator.answers(expected, result.answers);
                });
        };
    }

    createAssessmentAnswersFullFn(userIndex, assessmentIndex, status) {
        const self = this;
        return function createAssessmentAnswersFul() {
            const survey = self.hxSurvey.server(0);
            const answers = self.generator.answerQuestions(survey.questions);
            const userId = self.hxUser.id(userIndex);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status,
                userId,
                assessmentId,
            };
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(() => self.mapAnswers.set(assessmentIndex, answers))
                .then(() => self.mapStatus.set(assessmentIndex, status));
        };
    }

    createAssessmentAnswersPartialFn(userIndex, assessmentIndex) {
        const self = this;
        return function answerSurveyPartial() {
            const survey = self.hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = self.generator.answerQuestions(questions);
            const userId = self.hxUser.id(userIndex);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'in-progress',
                userId,
                assessmentId,
            };
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(() => self.mapAnswers.set(assessmentIndex, answers))
                .then(() => self.mapStatus.set(assessmentIndex, 'in-progress'));
        };
    }

    createAssessmentAnswersPartialCompletedFn(userIndex, assessmentIndex) {
        const self = this;
        return function createAssessmentAnswersPartialCompleted() {
            const survey = self.hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = self.generator.answerQuestions(questions);
            const userId = self.hxUser.id(userIndex);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'completed',
                userId,
                assessmentId,
            };
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(self.shared.throwingHandler, self.shared.expectedErrorHandler('answerRequiredMissing'));
        };
    }

    createAssessmentAnswersMissingPlusCompletedFn(userIndex, assessmentIndex) {
        const self = this;
        return function createAssessmentAnswersMissingPlusCompleted() {
            const survey = self.hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const notRequiredQuestions = survey.questions.filter(question => !question.required);
            expect(notRequiredQuestions).to.have.length.above(0);
            const questions = [...requiredQuestions, notRequiredQuestions[0]];
            const answers = self.generator.answerQuestions(questions);
            const userId = self.hxUser.id(userIndex);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
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
                    const fn = answer => !qxIdsNewlyAnswered.has(answer.questionId);
                    const previousAnswers = self.mapAnswers.get(assessmentIndex).filter(fn);
                    self.mapAnswers.set(key, [...previousAnswers, ...answers]);
                })
                .then(() => self.mapStatus.set(key, 'completed'));
        };
    }
};

const IntegrationTests = class AnswerIntegrationTests {
    constructor(rrSuperTest, options) {
        this.rrSuperTest = rrSuperTest;
        this.generator = options.generator;
        this.hxUser = options.hxUser;
        this.hxSurvey = options.hxSurvey;
        this.hxQuestion = options.hxQuestion;
        this.hxAnswer = new AnswerHistory();
        this.hxAssessment = options.hxAssessment;
        this.shared = options.shared;
        this.mapAnswers = new Map();
        this.mapStatus = new Map();
    }

    createAssessmentAnswersFn(userIndex, surveyIndex, qxIndices, assessmentIndex = null) {
        const rrSuperTest = this.rrSuperTest;
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function answerSurvey() {
            const survey = hxSurvey.server(surveyIndex);
            const answers = sharedAnswer.generateAnswers(generator, survey, hxQuestion, qxIndices);
            const input = { answers };
            const assessmentId = hxAssessment.id(assessmentIndex);
            const language = generator.nextLanguage();
            if (language) {
                input.language = language;
            }
            return rrSuperTest.post(`/assessment-answers/${assessmentId}`, input, 204)
                .then(() => {
                    hxAnswer.push(assessmentIndex, surveyIndex, answers, language);
                })
                .then(() => answers);
        };
    }

    getAssessmentAnswersFn(userIndex, surveyIndex, assessmentIndex = null) {
        const rrSuperTest = this.rrSuperTest;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function getAnswers() {
            const assessmentId = hxAssessment.id(assessmentIndex);
            return rrSuperTest.get(`/assessment-answers/${assessmentId}/answers`, true, 200)
                .then((res) => {
                    const expected = hxAnswer.expectedAnswers(assessmentIndex, surveyIndex);
                    comparator.answers(expected, res.body);
                    hxAnswer.pushServer(assessmentIndex, surveyIndex, res.body);
                });
        };
    }

    copyAssessmentAnswersFn(userIndex, surveyIndex, assessmentIndex, prevIndex) {
        const rrSuperTest = this.rrSuperTest;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function answerSurvey() {
            const assessmentId = hxAssessment.id(assessmentIndex);
            const prevAssessmentId = hxAssessment.id(prevIndex);
            const input = { prevAssessmentId };
            return rrSuperTest.post(`/assessment-answers/${assessmentId}/as-copy`, input, 204)
                .then(() => {
                    const prevExpected = hxAnswer.expectedAnswers(prevIndex, surveyIndex);
                    hxAnswer.copyAssessmentAnswers(assessmentIndex, surveyIndex, prevIndex);
                    const expected = hxAnswer.expectedAnswers(assessmentIndex, surveyIndex);
                    expect(expected).to.deep.equal(prevExpected);
                });
        };
    }

    verifyStatusFn(userIndex, assessmentIndex, expectedStatus) {
        const self = this;
        return function verifyStatus() {
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            return self.rrSuperTest.get(`/assessment-answers/${assessmentId}/status`, true, 200)
                .then(res => expect(res.body.status).to.equal(expectedStatus));
        };
    }

    verifyAssessmentAnswersListFn(statusList, group, indices) {
        const self = this;
        const hxAssessment = this.hxAssessment;
        return function verifyAssessmentAnswerList() {
            const query = group ? { group } : undefined;
            return self.rrSuperTest.get('/assessment-answers', true, 200, query)
                .then((res) => {
                    let expected = hxAssessment.listServers();
                    if (indices) {
                        expected = indices.map(index => expected[index]);
                        expected = _.cloneDeep(expected);
                    }
                    expected.forEach((r, index) => {
                        r.status = statusList[index];
                    });
                    expect(res.body).to.deep.equal(expected);
                });
        };
    }

    verifyAssessmentAnswersFn(userIndex, assessmentIndex, status) {
        const self = this;
        return function verifyAssessmentAnswers() {
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            return self.rrSuperTest.get(`/assessment-answers/${assessmentId}`, true, 200)
                .then((res) => {
                    const expected = self.mapAnswers.get(assessmentIndex) || [];
                    expect(res.body.status).to.equal(status);
                    comparator.answers(expected, res.body.answers);
                });
        };
    }

    createAssessmentAnswersFullFn(userIndex, assessmentIndex, status) {
        const self = this;
        return function createAssessmentAnswersFul() {
            const survey = self.hxSurvey.server(0);
            const answers = self.generator.answerQuestions(survey.questions);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status,
            };
            return self.rrSuperTest.post(`/assessment-answers/${assessmentId}`, input, 204)
                .then(() => self.mapAnswers.set(assessmentIndex, answers))
                .then(() => self.mapStatus.set(assessmentIndex, status));
        };
    }

    createAssessmentAnswersPartialFn(userIndex, assessmentIndex) {
        const self = this;
        return function answerSurveyPartial() {
            const survey = self.hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = self.generator.answerQuestions(questions);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'in-progress',
            };
            return self.rrSuperTest.post(`/assessment-answers/${assessmentId}`, input, 204)
                .then(() => self.mapAnswers.set(assessmentIndex, answers))
                .then(() => self.mapStatus.set(assessmentIndex, 'in-progress'));
        };
    }

    createAssessmentAnswersPartialCompletedFn(userIndex, assessmentIndex) {
        const self = this;
        return function createAssessmentAnswersPartialCompleted() {
            const survey = self.hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = self.generator.answerQuestions(questions);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'completed',
            };
            return self.rrSuperTest.post(`/assessment-answers/${assessmentId}`, input, 400)
                .then(res => self.shared.verifyErrorMessage(res, 'answerRequiredMissing'));
        };
    }

    createAssessmentAnswersMissingPlusCompletedFn(userIndex, assessmentIndex) {
        const self = this;
        return function createAssessmentAnswersMissingPlusCompleted() {
            const survey = self.hxSurvey.server(0);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const notRequiredQuestions = survey.questions.filter(question => !question.required);
            expect(notRequiredQuestions).to.have.length.above(0);
            const questions = [...requiredQuestions, notRequiredQuestions[0]];
            const answers = self.generator.answerQuestions(questions);
            const assessmentId = self.hxAssessment.id(assessmentIndex);
            const input = {
                answers,
                status: 'completed',
            };
            const key = assessmentIndex;
            return self.rrSuperTest.post(`/assessment-answers/${assessmentId}`, input, 204)
                .then(() => {
                    const qxIdsNewlyAnswered = new Set(answers.map(answer => answer.questionId));
                    const fn = answer => !qxIdsNewlyAnswered.has(answer.questionId);
                    const previousAnswers = self.mapAnswers.get(assessmentIndex).filter(fn);
                    self.mapAnswers.set(key, [...previousAnswers, ...answers]);
                })
                .then(() => self.mapStatus.set(key, 'completed'));
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
