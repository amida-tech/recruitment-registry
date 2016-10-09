/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const shared = require('../shared-spec.js');
const Generator = require('../entity-generator');
const comparator = require('../client-server-comparator');

const expect = chai.expect;
const generator = new Generator();

const Question = models.Question;
const Survey = models.Survey;

describe('question unit', function () {
    before(shared.setUpFn());

    const store = {
        clientQuestions: [],
        questions: [],
        surveyIds: []
    };

    it('get all questions when none', function () {
        return Question.getAllQuestions()
            .then(questions => {
                expect(questions).to.have.length(0);
            });
    });

    const qxBasicFn = function () {
        return function () {
            const clientQuestion = generator.newQuestion();
            store.clientQuestions.push(clientQuestion);
            return Question.createQuestion(clientQuestion)
                .then(id => Question.getQuestion(id))
                .then(question => {
                    comparator.question(clientQuestion, question);
                    store.questions.push(question);
                    return question;
                })
                .then(question => {
                    const text = `Updated ${clientQuestion.text}`;
                    return Question.updateQuestion(question.id, { text })
                        .then(() => question);
                })
                .then(question => Question.getQuestion(question.id))
                .then(updatedQuestion => {
                    const updatedText = `Updated ${clientQuestion.text}`;
                    const updatedInputQuestion = Object.assign({}, clientQuestion, { text: updatedText });
                    comparator.question(updatedInputQuestion, updatedQuestion);
                    const text = clientQuestion.text;
                    return Question.updateQuestion(updatedQuestion.id, { text });
                });
        };
    };

    for (let i = 0; i < 10; ++i) {
        it(`create/get/update question ${i}`, qxBasicFn());
    }

    it('error: get with non-existent id', function () {
        return Question.getQuestion(99999)
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound'));
    });

    it('get multiple questions', function () {
        const indices = [2, 4, 7];
        const ids = indices.map(i => store.questions[i].id);
        const clientQuestions = indices.map(i => store.clientQuestions[i]);
        return Question.getQuestions(ids)
            .then(questions => comparator.questions(clientQuestions, questions));
    });

    it('get all questions', function () {
        return Question.getAllQuestions()
            .then(questions => comparator.questions(store.clientQuestions, questions));
    });

    it('error: get multiple with non-existent id', function () {
        return Question.getQuestions([1, 99999])
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound'));
    });

    const qxDeleteFn = function (index) {
        return function () {
            return Question.deleteQuestion(store.questions[index].id)
                .then(() => {
                    store.clientQuestions.splice(index, 1);
                    store.questions.splice(index, 1);
                });
        };
    };

    _.forEach([1, 4, 6], index => {
        it(`remove question current index ${index}`, qxDeleteFn(index));
    });

    it('verify all questions', function () {
        return Question.getAllQuestions()
            .then(questions => comparator.questions(store.clientQuestions, questions));
    });

    for (let i = 10; i < 20; ++i) {
        it(`create/get/update question ${i}`, qxBasicFn());
    }

    const createSurveyFn = function (questionIndices) {
        return function () {
            const questionIds = questionIndices.map(index => store.questions[index].id);
            const clientSurvey = generator.newSurveyQuestionIds(questionIds);
            return Survey.createSurvey(clientSurvey)
                .then(id => store.surveyIds.push(id));
        };
    };

    _.forEach([
        [1, 2, 7],
        [6, 7, 11],
        [5, 6, 8, 14, 15]
    ], questionIndices => {
        it(`create survey from questions indexed ${questionIndices}`, createSurveyFn(questionIndices));
    });

    _.forEach([1, 6, 7, 14], questionIndex => {
        it(`error: delete question (${questionIndex}) on an active survey`, function () {
            return Question.deleteQuestion(store.questions[questionIndex].id)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey currently indexed 1', function () {
        return Survey.deleteSurvey(store.surveyIds[1])
            .then(() => store.surveyIds.splice(1, 1));
    });

    _.forEach([1, 6, 7, 14], questionIndex => {
        it(`error: delete question (${questionIndex}) on an active survey`, function () {
            return Question.deleteQuestion(store.questions[questionIndex].id)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey currently indexed 1', function () {
        return Survey.deleteSurvey(store.surveyIds[1])
            .then(() => store.surveyIds.splice(1, 1));
    });

    _.forEach([1, 7], questionIndex => {
        it(`error: delete question (${questionIndex}) on an active survey`, function () {
            return Question.deleteQuestion(store.questions[questionIndex].id)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    _.forEach([6, 7], index => {
        it(`remove question current index ${index}`, qxDeleteFn(index));
    });

    it(`error: replace a non-existent question`, function () {
        const replacement = generator.newQuestion();
        return Question.replaceQuestion(999, replacement)
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound'));
    });

    _.forEach([
        [6, 10, 11],
        [3, 5, 8]
    ], questionIndices => {
        it(`create survey from questions indexed ${questionIndices}`, createSurveyFn(questionIndices));
    });

    _.forEach([1, 6, 11], questionIndex => {
        it(`error: delete question (${questionIndex}) on an active survey`, function () {
            const replacement = generator.newQuestion();
            return Question.replaceQuestion(store.questions[questionIndex].id, replacement)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey currently indexed 0', function () {
        return Survey.deleteSurvey(store.surveyIds[0])
            .then(() => store.surveyIds.splice(0, 1));
    });

    _.forEach([6, 11], questionIndex => {
        it(`error: delete question (${questionIndex}) on an active survey`, function () {
            const replacement = generator.newQuestion();
            return Question.replaceQuestion(store.questions[questionIndex].id, replacement)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey currently indexed 0', function () {
        return Survey.deleteSurvey(store.surveyIds[0])
            .then(() => store.surveyIds.splice(0, 1));
    });

    _.forEach([6, 8, 9, -2, -2, -1], questionIndex => {
        it(`replace question (${questionIndex})`, function () {
            const replacement = generator.newQuestion();
            store.clientQuestions.push(replacement);
            const index = questionIndex > 0 ? questionIndex : questionIndex + store.questions.length;
            return Question.replaceQuestion(store.questions[index].id, replacement)
                .then(({ id }) => Question.getQuestion(id))
                .then(question => {
                    comparator.question(replacement, question);
                    store.clientQuestions.splice(index, 1);
                    store.questions.splice(index, 1);
                    store.questions.push(question);
                    return question;
                })
                .then(() => Question.getAllQuestions())
                .then(questions => comparator.questions(store.clientQuestions, questions));
        });
    });

    const verifyVersioningFn = function (index, expectedVersion) {
        return function () {
            if (index < 0) {
                index += store.questions.length;
            }
            const id = store.questions[index].id;
            return Question.findById(id, { attributes: ['groupId', 'version'], raw: true })
                .then(versionInfo => {
                    expect(versionInfo.version).to.equal(expectedVersion);
                    return versionInfo;
                })
                .then(versionInfo => {
                    return Question.count({ where: { groupId: versionInfo.groupId }, paranoid: false })
                        .then(count => expect(count).to.equal(versionInfo.version));
                });
        };
    };

    it('verify versioning (-1)', verifyVersioningFn(-1, 4));
    it('verify versioning (-2)', verifyVersioningFn(-2, 3));
    it('verify versioning (-3)', verifyVersioningFn(-3, 2));
});
