'use strict';

const chai = require('chai');

const models = require('../../models');
const comparator = require('./comparator');
const MultiIndexStore = require('./multi-index-store');

const expect = chai.expect;

const testQuestions = [{
    survey: [0, 1, 2, 3, 4],
    answerSequences: [
        [
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [-1, -2]
        ]
    ]
}, {
    survey: [4, 5, 6, 0],
    answerSequences: [
        [
            [4, 5, 6, 0],
            [4, -6],
            [6, 0]
        ]
    ]
}, {
    survey: [7, 8, 9, 10, 11, 12],
    answerSequences: [
        [
            [8, 10, 11, 12],
            [7, 10, -12],
            [9, 10, 11, -8]
        ]
    ]
}, {
    survey: [9, 11, 13, 6],
    answerSequences: [
        [
            [9, 13],
            [6, 11],
            [-9, 11]
        ],
        [
            [9, 11, 13, 6],
            [9, 11, -6],
            [11, 13]
        ]
    ]
}, {
    survey: [14, 15, 16, 17, 18, 19],
    answerSequences: [
        [
            [14, 15, 16, 17, 18, 19],
            [-15, 16, -17, -19],
            [14, 17, 19]
        ]
    ]
}];

const SpecTests = class AnswerSpecTests {
    constructor(generator, hxUser, hxSurvey, hxAnswer) {
        this.generator = generator;
        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
        this.hxAnswer = hxAnswer || new MultiIndexStore();
    }

    answerSurveyFn(userIndex, surveyIndex) {
        const generator = this.generator;
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = { userId, surveyId: survey.id, answers };
            return models.answer.createAnswers(input)
                .then(() => hxAnswer.set([userIndex, surveyIndex], answers));
        };
    }

    verifyAnsweredSurveyFn(userIndex, surveyIndex) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = hxAnswer.get([userIndex, surveyIndex]);
            return models.survey.getAnsweredSurvey(userId, survey.id)
                .then(answeredSurvey => {
                    comparator.answeredSurvey(survey, answers, answeredSurvey);
                });
        };
    }

    listAnswersForUserFn(userIndex) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function () {
            const userId = hxUser.id(userIndex);
            const expectedRaw = hxAnswer.listFlatForIndex(0, userIndex);
            const expected = expectedRaw.reduce((r, e) => {
                const survey = hxSurvey.server(e[1]);
                const idToType = new Map(survey.questions.map(question => [question.id, question.type]));
                const surveyId = hxSurvey.id(e[1]);
                e.obj.forEach(answer => {
                    const dbAnswers = models.answer.toDbAnswer(answer.answer);
                    dbAnswers.forEach(dbAnswer => {
                        const value = Object.assign({ surveyId, questionId: answer.questionId }, dbAnswer);
                        value.questionType = idToType.get(value.questionId);
                        if (value.hasOwnProperty('value')) {
                            value.value = value.value.toString();
                        }
                        r.push(value);
                    });
                });
                return r;
            }, []);
            return models.answer.listAnswers({ scope: 'export', userId })
                .then(answers => {
                    expect(answers).to.deep.equal(expected);
                    hxAnswer.lastAnswers = answers;
                });
        };
    }
};

const IntegrationTests = class AnswerIntegrationTests {
    constructor(rrSuperTest, generator, hxUser, hxSurvey, hxAnswer) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
        this.hxAnswer = hxAnswer || new MultiIndexStore();
    }

    answerSurveyFn(userIndex, surveyIndex) {
        const rrSuperTest = this.rrSuperTest;
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                surveyId: hxSurvey.id(surveyIndex),
                answers
            };
            rrSuperTest.post('/answers', input, 204)
                .expect(function () {
                    hxAnswer.set([userIndex, surveyIndex], answers);
                })
                .end(done);
        };
    }

    verifyAnsweredSurveyFn(userIndex, surveyIndex) {
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        const rrSuperTest = this.rrSuperTest;
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = hxAnswer.get([userIndex, surveyIndex]);
            rrSuperTest.get(`/answered-surveys/${survey.id}`, true, 200)
                .expect(function (res) {
                    comparator.answeredSurvey(survey, answers, res.body);
                })
                .end(done);
        };
    }

    listAnswersForUserFn(userIndex) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function (done) {
            const expectedRaw = hxAnswer.listFlatForIndex(0, userIndex);
            const expected = expectedRaw.reduce((r, e) => {
                const survey = hxSurvey.server(e[1]);
                const idToType = new Map(survey.questions.map(question => [question.id, question.type]));
                const surveyId = hxSurvey.id(e[1]);
                e.obj.forEach(answer => {
                    const dbAnswers = models.answer.toDbAnswer(answer.answer);
                    dbAnswers.forEach(dbAnswer => {
                        const value = Object.assign({ surveyId, questionId: answer.questionId }, dbAnswer);
                        value.questionType = idToType.get(value.questionId);
                        if (value.hasOwnProperty('value')) {
                            value.value = value.value.toString();
                        }
                        r.push(value);
                    });
                });
                return r;
            }, []);
            rrSuperTest.get(`/answers/export`, true, 200)
                .expect(function (res) {
                    expect(res.body).to.deep.equal(expected);
                    hxAnswer.lastAnswers = res.body;
                })
                .end(done);
        };
    }
};

module.exports = {
    testQuestions,
    SpecTests,
    IntegrationTests
};
