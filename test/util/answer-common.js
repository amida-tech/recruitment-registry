'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const comparator = require('./comparator');
const AnswerHistory = require('./answer-history');
const Answerer = require('./generator/answerer');

const expect = chai.expect;

const testQuestions = [{
    survey: [0, 1, 2, 3, 4],
    answerSequences: [
        [
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [-1, -2],
        ],
    ],
}, {
    survey: [4, 5, 6, 0],
    answerSequences: [
        [
            [4, 5, 6, 0],
            [4, -6],
            [6, 0],
        ],
    ],
}, {
    survey: [7, 8, 9, 10, 11, 12],
    answerSequences: [
        [
            [8, 10, 11, 12],
            [7, 10, -12],
            [9, 10, 11, -8],
        ],
    ],
}, {
    survey: [9, 11, 13, 6],
    answerSequences: [
        [
            [9, 13],
            [6, 11],
            [-9, 11],
        ],
        [
            [9, 11, 13, 6],
            [9, 11, -6],
            [11, 13],
        ],
    ],
}, {
    survey: [14, 15, 16, 17, 18, 19],
    answerSequences: [
        [
            [14, 15, 16, 17, 18, 19],
            [-15, 16, -17, -19],
            [14, 17, 19],
        ],
    ],
}];

const generateAnswers = function (generator, survey, hxQuestion, qxIndices) {
    if (qxIndices) {
        return qxIndices.map((questionIndex) => {
            if (questionIndex < 0) {
                const questionId = hxQuestion.id(-questionIndex);
                return { questionId };
            }
            const question = hxQuestion.server(questionIndex);
            return generator.answerQuestion(question);
        });
    }
    return generator.answerQuestions(survey.questions);
};

const expectedAnswerListForUser = function (userIndex, hxSurvey, hxAnswer) {
    const expectedRaw = hxAnswer.listFlatForUser(userIndex);
    const expected = expectedRaw.reduce((r, e) => {
        const survey = hxSurvey.server(e.surveyIndex);
        const idToType = new Map(survey.questions.map(question => [question.id, question.type]));
        const choiceIdToType = new Map();
        survey.questions.forEach((question) => {
            if (question.type === 'choices') {
                question.choices.forEach(choice => choiceIdToType.set(choice.id, choice.type));
            }
        });
        const surveyId = survey.id;
        e.answers.forEach((answer) => {
            const dbAnswers = models.answer.toDbAnswer(answer.answer);
            dbAnswers.forEach((dbAnswer) => {
                const value = Object.assign({ surveyId, questionId: answer.questionId }, dbAnswer);
                value.questionType = idToType.get(value.questionId);
                if (Object.prototype.hasOwnProperty.call(value, 'value')) {
                    value.value = value.value.toString();
                }
                if (value.questionType === 'choices') {
                    value.choiceType = choiceIdToType.get(value.questionChoiceId);
                }
                r.push(value);
            });
        });
        return r;
    }, []);
    return expected;
};

const answersToSearchQuery = function (answers) {
    const questions = answers.map(answer => ({
        id: answer.questionId,
        answer: answer.answer,
        answers: answer.answers,
    }));
    return { questions };
};

const AllChoicesAnswerer = class AllChoicesAnswerer extends Answerer {
    choices(question) {
        const choices = question.choices.map((choice) => {
            this.answerIndex += 1;
            const answer = { id: choice.id };
            const type = _.camelCase(choice.type || 'bool');
            Object.assign(answer, this[type]());
            return answer;
        });
        return { choices };
    }
};

const BoolSoleChoicesAnswerer = class BoolSoleChoicesAnswerer extends Answerer {
    choices(question) {
        const choice = question.choices.find(choice => choice.type === 'bool-sole');
        return { choices: [{ id: choice.id, boolValue: true }] };
    }
};

const SpecTests = class AnswerSpecTests {
    constructor(generator, hxUser, hxSurvey, hxQuestion) {
        this.generator = generator;
        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
        this.hxQuestion = hxQuestion;
        this.hxAnswer = new AnswerHistory();
    }

    answerSurveyFn(userIndex, surveyIndex, qxIndices) {
        const generator = this.generator;
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const hxAnswer = this.hxAnswer;
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = generateAnswers(generator, survey, hxQuestion, qxIndices);
            const surveyId = survey.id;
            const input = { userId, surveyId, answers };
            const language = generator.nextLanguage();
            if (language) {
                input.language = language;
            }
            return models.answer.createAnswers(input)
                .then(() => hxAnswer.push(userIndex, surveyIndex, answers, language))
                .then(() => answers);
        };
    }

    getAnswersFn(userIndex, surveyIndex) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function () {
            return models.answer.getAnswers({
                userId: hxUser.id(userIndex),
                surveyId: hxSurvey.id(surveyIndex),
            })
                .then((result) => {
                    const expected = hxAnswer.expectedAnswers(userIndex, surveyIndex);
                    comparator.answers(expected, result);
                });
        };
    }

    verifyAnsweredSurveyFn(userIndex, surveyIndex) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const { answers } = hxAnswer.getLast(userIndex, surveyIndex);
            return models.survey.getAnsweredSurvey(userId, survey.id)
                .then((answeredSurvey) => {
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
            const expected = expectedAnswerListForUser(userIndex, hxSurvey, hxAnswer);
            return models.answer.listAnswers({ scope: 'export', userId })
                .then((answers) => {
                    expect(answers).to.deep.equal(expected);
                    hxAnswer.lastAnswers = answers;
                });
        };
    }
};

const IntegrationTests = class AnswerIntegrationTests {
    constructor(rrSuperTest, generator, hxUser, hxSurvey, hxQuestion) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
        this.hxQuestion = hxQuestion;
        this.hxAnswer = new AnswerHistory();
    }

    answerSurveyFn(userIndex, surveyIndex, qxIndices) {
        const rrSuperTest = this.rrSuperTest;
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const hxAnswer = this.hxAnswer;
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generateAnswers(generator, survey, hxQuestion, qxIndices);
            const input = {
                surveyId: survey.id,
                answers,
            };
            const language = generator.nextLanguage();
            if (language) {
                input.language = language;
            }
            return rrSuperTest.post('/answers', input, 204)
                .expect(() => {
                    hxAnswer.push(userIndex, surveyIndex, answers, language);
                })
                .then(() => answers);
        };
    }

    getAnswersFn(userIndex, surveyIndex) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function (done) {
            const surveyId = hxSurvey.id(surveyIndex);
            rrSuperTest.get('/answers', true, 200, { 'survey-id': surveyId })
                .expect((res) => {
                    const expected = hxAnswer.expectedAnswers(userIndex, surveyIndex);
                    comparator.answers(expected, res.body);
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
            const { answers } = hxAnswer.getLast(userIndex, surveyIndex);
            rrSuperTest.get(`/answered-surveys/${survey.id}`, true, 200)
                .expect((res) => {
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
            const expected = expectedAnswerListForUser(userIndex, hxSurvey, hxAnswer);
            rrSuperTest.get('/answers/export', true, 200)
                .expect((res) => {
                    expect(res.body).to.deep.equal(expected);
                    hxAnswer.lastAnswers = res.body;
                })
                .end(done);
        };
    }
};

module.exports = {
    testQuestions,
    answersToSearchQuery,
    generateAnswers,
    SpecTests,
    IntegrationTests,
    AllChoicesAnswerer,
    BoolSoleChoicesAnswerer,
};
