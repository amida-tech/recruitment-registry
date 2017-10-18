'use strict';

const chai = require('chai');

const models = require('../../models');
const comparator = require('./comparator');
const AnswerHistory = require('./answer-history');
const shared = require('./shared-answer');

const expect = chai.expect;

const SpecTests = class AnswerSpecTests {
    constructor(options) {
        this.generator = options.generator;
        this.hxUser = options.hxUser;
        this.hxSurvey = options.hxSurvey;
        this.hxQuestion = options.hxQuestion;
        this.hxAssessment = options.hxAssessment;
        this.hxAnswer = new AnswerHistory();
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
            const answers = shared.generateAnswers(generator, survey, hxQuestion, qxIndices);
            const surveyId = survey.id;
            const input = { userId, surveyId, answers };
            if (assessmentIndex !== null) {
                const assessmentId = hxAssessment.id(assessmentIndex);
                input.assessmentId = assessmentId;
            }
            const language = generator.nextLanguage();
            if (language) {
                input.language = language;
            }
            return models.assessmentAnswer.createAssessmentAnswers(input)
                .then(() => {
                    if (assessmentIndex === null) {
                        hxAnswer.push(userIndex, surveyIndex, answers, language);
                    } else {
                        hxAnswer.push(assessmentIndex, surveyIndex, answers, language);
                    }
                })
                .then(() => answers);
        };
    }

    getAssessmentAnswersFn(userIndex, surveyIndex, assessmentIndex = null) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function getAssessmentAnswers() {
            const masterId = {};
            const surveyId = hxSurvey.id(surveyIndex);
            if (assessmentIndex === null) {
                const userId = hxUser.id(userIndex);
                Object.assign(masterId, { userId, surveyId });
            } else {
                const assessmentId = hxAssessment.id(assessmentIndex);
                Object.assign(masterId, { assessmentId });
            }
            return models.assessmentAnswer.getAssessmentAnswersOnly(masterId)
                .then((result) => {
                    const masterIndex = assessmentIndex === null ? userIndex : assessmentIndex;
                    const expected = hxAnswer.expectedAnswers(masterIndex, surveyIndex);
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
            const answers = shared.generateAnswers(generator, survey, hxQuestion, qxIndices);
            const input = {
                surveyId: survey.id,
                answers,
            };
            if (assessmentIndex !== null) {
                const assessmentId = hxAssessment.id(assessmentIndex);
                input.assessmentId = assessmentId;
            }
            const language = generator.nextLanguage();
            if (language) {
                input.language = language;
            }
            return rrSuperTest.post('/assessment-answers', input, 204)
                .expect(() => {
                    if (assessmentIndex === null) {
                        hxAnswer.push(userIndex, surveyIndex, answers, language);
                    } else {
                        hxAnswer.push(assessmentIndex, surveyIndex, answers, language);
                    }
                })
                .then(() => answers);
        };
    }

    getAssessmentAnswersFn(userIndex, surveyIndex, assessmentIndex = null) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function getAnswers(done) {
            const query = {};
            const surveyId = hxSurvey.id(surveyIndex);
            if (assessmentIndex === null) {
                Object.assign(query, { 'survey-id': surveyId });
            } else {
                const assessmentId = hxAssessment.id(assessmentIndex);
                Object.assign(query, { 'assessment-id': assessmentId });
            }
            rrSuperTest.get('/assessment-answers', true, 200, query)
                .expect((res) => {
                    const masterIndex = assessmentIndex === null ? userIndex : assessmentIndex;
                    const expected = hxAnswer.expectedAnswers(masterIndex, surveyIndex);
                    comparator.answers(expected, res.body);
                    hxAnswer.pushServer(masterIndex, surveyIndex, res.body);
                })
                .end(done);
        };
    }


};

module.exports = {
    SpecTests,
    IntegrationTests,
};
