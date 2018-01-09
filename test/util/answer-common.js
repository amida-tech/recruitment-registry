'use strict';

const _ = require('lodash');
const chai = require('chai');

const models = require('../../models');
const comparator = require('./comparator');
const AnswerHistory = require('./answer-history');
const modelsAnswerCommon = require('../../models/dao/answer-common');
const shared = require('./shared-answer');

const expect = chai.expect;

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
            const dbAnswers = modelsAnswerCommon.prepareAnswerForDB(answer.answer);
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

const answersToSearchQuery = function (inputAnswers) {
    const questions = inputAnswers.map((inputAnswer) => {
        const id = inputAnswer.questionId;
        let answers = null;
        if (inputAnswer.answers) {
            answers = inputAnswer.answers.map(r => _.omit(r, 'multipleIndex'));
        } else if (inputAnswer.answer.choices) {
            answers = inputAnswer.answer.choices.map(c => ({ choice: c.id, boolValue: true }));
        } else {
            answers = [inputAnswer.answer];
        }
        return { id, answers };
    });
    return { questions };
};

const compareImportedAnswers = function (actual, rawExpected, maps) {
    const { userIdMap, questionIdMap } = maps;
    const expected = _.cloneDeep(rawExpected);
    expected.forEach((r) => {
        const questionIdInfo = questionIdMap[r.questionId];
        r.questionId = questionIdInfo.questionId;
        if (r.questionChoiceId) {
            const choicesIds = questionIdInfo.choicesIds;
            r.questionChoiceId = choicesIds[r.questionChoiceId];
        }
        if (userIdMap) {
            r.userId = userIdMap[r.userId];
        }
    });
    expect(actual).to.deep.equal(expected);
};

const SpecTests = class AnswerSpecTests {
    constructor(options) {
        this.generator = options.generator;
        this.hxUser = options.hxUser;
        this.hxSurvey = options.hxSurvey;
        this.hxQuestion = options.hxQuestion;
        this.hxAnswer = new AnswerHistory();
    }

    answerSurveyFn(userIndex, surveyIndex, qxIndices) {
        const generator = this.generator;
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const hxAnswer = this.hxAnswer;
        return function answerSurvey() {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = shared.generateAnswers(generator, survey, hxQuestion, qxIndices);
            const surveyId = survey.id;
            const input = { userId, surveyId, answers };
            const language = generator.nextLanguage();
            if (language) {
                input.language = language;
            }
            return models.answer.createAnswers(input)
                .then(() => {
                    hxAnswer.push(userIndex, surveyIndex, answers, language);
                })
                .then(() => answers);
        };
    }

    getAnswersFn(userIndex, surveyIndex, assessmentIndex = null) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function getAnswers() {
            const masterId = {};
            const surveyId = hxSurvey.id(surveyIndex);
            if (assessmentIndex === null) {
                const userId = hxUser.id(userIndex);
                Object.assign(masterId, { userId, surveyId });
            } else {
                const assessmentId = hxAssessment.id(assessmentIndex);
                Object.assign(masterId, { assessmentId });
            }
            return models.answer.getAnswers(masterId)
                .then((result) => {
                    const masterIndex = assessmentIndex === null ? userIndex : assessmentIndex;
                    const expected = hxAnswer.expectedAnswers(masterIndex, surveyIndex);
                    const options = assessmentIndex === null ? {} : { surveyId };
                    comparator.answers(expected, result, options);
                    hxAnswer.pushServer(masterIndex, surveyIndex, result);
                });
        };
    }

    verifyAnsweredSurveyFn(userIndex, surveyIndex) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function verifyAnsweredSurvey() {
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
        return function listAnswersForUser() {
            const userId = hxUser.id(userIndex);
            const expected = expectedAnswerListForUser(userIndex, hxSurvey, hxAnswer);
            return models.answer.listAnswers({ scope: 'export', userId })
                .then((answers) => {
                    expect(answers).to.deep.equal(expected);
                    return answers;
                });
        };
    }

    listAnswersForUsersFn(userIndices) {
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function listAnswersForUsers() {
            const userIds = userIndices.map(index => hxUser.id(index));
            const expected = [];
            userIndices.forEach((index) => {
                const userExpected = expectedAnswerListForUser(index, hxSurvey, hxAnswer);
                const userId = hxUser.id(index);
                userExpected.forEach(r => Object.assign(r, { userId }));
                expected.push(...userExpected);
            });
            return models.answer.listAnswers({ scope: 'export', userIds })
                .then((answers) => {
                    const actual = _.sortBy(answers, ['userId', 'surveyId']);
                    expect(actual).to.deep.equal(expected);
                    return actual;
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
    }

    answerSurveyFn(userIndex, surveyIndex, qxIndices) {
        const rrSuperTest = this.rrSuperTest;
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const hxAnswer = this.hxAnswer;
        return function answerSurvey() {
            const survey = hxSurvey.server(surveyIndex);
            const answers = shared.generateAnswers(generator, survey, hxQuestion, qxIndices);
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

    getAnswersFn(userIndex, surveyIndex, assessmentIndex = null) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        const hxAssessment = this.hxAssessment;
        return function getAnswers(done) {
            const query = {};
            const surveyId = hxSurvey.id(surveyIndex);
            Object.assign(query, { isIdentifying: true });
            if (assessmentIndex === null) {
                Object.assign(query, { 'survey-id': surveyId });
            } else {
                const assessmentId = hxAssessment.id(assessmentIndex);
                Object.assign(query, { 'assessment-id': assessmentId });
            }
            rrSuperTest.get('/answers', true, 200, query)
                .expect((res) => {
                    const masterIndex = assessmentIndex === null ? userIndex : assessmentIndex;
                    const expected = hxAnswer.expectedAnswers(masterIndex, surveyIndex);
                    const options = assessmentIndex === null ? {} : { surveyId };
                    comparator.answers(expected, res.body, options);
                    hxAnswer.pushServer(masterIndex, surveyIndex, res.body);
                })
                .end(done);
        };
    }

    verifyAnsweredSurveyFn(userIndex, surveyIndex) {
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        const rrSuperTest = this.rrSuperTest;
        return function verifyAnsweredSurvey(done) {
            const survey = _.cloneDeep(hxSurvey.server(surveyIndex));
            const { answers } = hxAnswer.getLast(userIndex, surveyIndex);
            rrSuperTest.get(`/answered-surveys/${survey.id}`, true, 200)
                .expect((res) => {
                    if (rrSuperTest.userRole !== 'admin') {
                        delete survey.authorId;
                        delete survey.consentTypeIds;
                    }
                    comparator.answeredSurvey(survey, answers, res.body);
                })
                .end(done);
        };
    }

    listAnswersForUserFn(userIndex) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function listAnswersForUser() {
            const expected = expectedAnswerListForUser(userIndex, hxSurvey, hxAnswer);
            return rrSuperTest.get('/answers/export', true, 200)
                .then((res) => {
                    expect(res.body).to.deep.equal(expected);
                    return res.body;
                });
        };
    }

    listAnswersForUsersFn(userIndices) {
        const rrSuperTest = this.rrSuperTest;
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswer = this.hxAnswer;
        return function listAnswersForUsers() {
            const userIds = userIndices.map(index => hxUser.id(index));
            const expected = [];
            userIndices.forEach((index) => {
                const userExpected = expectedAnswerListForUser(index, hxSurvey, hxAnswer);
                const userId = hxUser.id(index);
                userExpected.forEach(r => Object.assign(r, { userId }));
                expected.push(...userExpected);
            });
            const query = { 'user-ids': userIds };
            return rrSuperTest.get('/answers/multi-user-export', true, 200, query)
                .then((res) => {
                    const actual = _.sortBy(res.body, ['userId', 'surveyId']);
                    expect(actual).to.deep.equal(expected);
                    return actual;
                });
        };
    }
};

module.exports = {
    answersToSearchQuery,
    compareImportedAnswers,
    SpecTests,
    IntegrationTests,
};
