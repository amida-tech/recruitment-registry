/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const History = require('./util/entity-history');
const translator = require('./util/translator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec();

const Question = models.Question;
const Survey = models.Survey;

describe('question unit', function () {
    before(shared.setUpFn());

    const hxQuestion = new History();
    const hxSurvey = new History();

    it('get all questions when none', function () {
        return Question.listQuestions()
            .then(questions => {
                expect(questions).to.have.length(0);
            });
    });

    const qxBasicFn = function () {
        return function () {
            const clientQuestion = generator.newQuestion();
            return Question.createQuestion(clientQuestion)
                .then(id => Question.getQuestion(id))
                .then(question => {
                    comparator.question(clientQuestion, question);
                    hxQuestion.push(clientQuestion, question);
                    return question;
                })
                .then(question => {
                    const text = `Updated ${clientQuestion.text}`;
                    return Question.updateQuestionText({ id: question.id, text })
                        .then(() => question);
                })
                .then(question => Question.getQuestion(question.id))
                .then(updatedQuestion => {
                    const updatedText = `Updated ${clientQuestion.text}`;
                    const updatedInputQuestion = Object.assign({}, clientQuestion, { text: updatedText });
                    comparator.question(updatedInputQuestion, updatedQuestion);
                    const text = clientQuestion.text;
                    return Question.updateQuestionText({ id: updatedQuestion.id, text });
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

    it('get multiple questions (2, 4, 7)', function () {
        const indices = [2, 4, 7];
        const ids = indices.map(i => hxQuestion.id(i));
        const clientQuestions = indices.map(i => hxQuestion.client(i));
        return Question.listQuestions({ ids })
            .then(questions => comparator.questions(clientQuestions, questions));
    });

    it('get all questions', function () {
        return Question.listQuestions()
            .then(questions => comparator.questions(hxQuestion.listClients(), questions));
    });

    it('error: get multiple with non-existent id', function () {
        return Question.listQuestions({ ids: [1, 99999] })
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound'));
    });

    const translateQuestionFn = function (index, language) {
        return function () {
            const server = hxQuestion.server(index);
            const translation = translator.translateQuestion(server, language);
            return Question.updateQuestionText(translation, language)
                .then(() => {
                    hxQuestion.translate(index, language, translation);
                });
        };
    };

    const getTranslatedQuestionFn = function (index, language) {
        return function () {
            const id = hxQuestion.id(index);
            return Question.getQuestion(id, { language })
                .then(result => {
                    const expected = hxQuestion.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const listTranslatedQuestionsFn = function (language) {
        return function () {
            return Question.listQuestions({ language })
                .then(result => {
                    const expected = hxQuestion.listTranslatedServers(language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('get question 3 in spanish when no name translation', getTranslatedQuestionFn(3, 'es'));

    it('list questions in spanish when no translation', listTranslatedQuestionsFn('es'));

    for (let i = 0; i < 10; ++i) {
        it(`add translated (es) question ${i}`, translateQuestionFn(i, 'es'));
        it(`get and verify tanslated question ${i}`, getTranslatedQuestionFn(i, 'es'));
    }

    it('list and verify translated (es) questions', listTranslatedQuestionsFn('es'));

    for (let i = 0; i < 10; i += 2) {
        it(`add translated (fr) question ${i}`, translateQuestionFn(i, 'fr'));
        it(`get and verify tanslated (fr) question ${i}`, getTranslatedQuestionFn(i, 'fr'));
    }

    it('list and verify translated (fr) questions', listTranslatedQuestionsFn('fr'));

    it('list questions in english (original)', listTranslatedQuestionsFn('en'));

    const qxDeleteFn = function (index) {
        return function () {
            return Question.deleteQuestion(hxQuestion.id(index))
                .then(() => {
                    hxQuestion.remove(index);
                });
        };
    };

    _.forEach([1, 4, 6], index => {
        it(`delete question ${index}`, qxDeleteFn(index));
    });

    it('verify all questions', function () {
        return Question.listQuestions()
            .then(questions => comparator.questions(hxQuestion.listClients(), questions));
    });

    for (let i = 10; i < 20; ++i) {
        it(`create/get/update question ${i}`, qxBasicFn());
    }

    const createSurveyFn = function (questionIndices) {
        return function () {
            const questionIds = questionIndices.map(index => hxQuestion.id(index));
            const clientSurvey = generator.newSurveyQuestionIds(questionIds);
            return Survey.createSurvey(clientSurvey)
                .then(id => hxSurvey.push(clientSurvey, { id }));
        };
    };

    [
        [2, 7, 9],
        [7, 11, 13],
        [5, 8, 11, 14, 15]
    ].forEach((questionIndices, index) => {
        it(`create survey ${index} from questions ${questionIndices}`, createSurveyFn(questionIndices));
    });

    _.forEach([2, 7, 11, 13, 14], questionIndex => {
        it(`error: delete question ${questionIndex} on an active survey`, function () {
            return Question.deleteQuestion(hxQuestion.id(questionIndex))
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey 1', function () {
        return Survey.deleteSurvey(hxSurvey.id(1))
            .then(() => hxSurvey.remove(1));
    });

    _.forEach([2, 7, 11, 14], questionIndex => {
        it(`error: delete question ${questionIndex} on an active survey`, function () {
            return Question.deleteQuestion(hxQuestion.id(questionIndex))
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey 2', function () {
        return Survey.deleteSurvey(hxSurvey.id(2))
            .then(() => hxSurvey.remove(2));
    });

    _.forEach([2, 7], questionIndex => {
        it(`error: delete question ${questionIndex} on an active survey`, function () {
            return Question.deleteQuestion(hxQuestion.id(questionIndex))
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    _.forEach([5, 11, 15], index => {
        it(`delete question ${index}`, qxDeleteFn(index));
    });

    it(`error: replace a non-existent question`, function () {
        const replacement = generator.newQuestion();
        return Question.replaceQuestion(999, replacement)
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound'));
    });

    [
        [7, 10, 17],
        [3, 8, 9]
    ].forEach((questionIndices, index) => {
        it(`create survey ${index + 3} from questions ${questionIndices}`, createSurveyFn(questionIndices));
    });

    _.forEach([2, 7, 9], questionIndex => {
        it(`error: replace question ${questionIndex} on an active survey`, function () {
            const replacement = generator.newQuestion();
            return Question.replaceQuestion(hxQuestion.id(questionIndex), replacement)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey 0', function () {
        return Survey.deleteSurvey(hxSurvey.id(0))
            .then(() => hxSurvey.remove(0));
    });

    _.forEach([7, 9], questionIndex => {
        it(`error: replace question ${questionIndex} on an active survey`, function () {
            const replacement = generator.newQuestion();
            return Question.replaceQuestion(hxQuestion.id(questionIndex), replacement)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey 3', function () {
        return Survey.deleteSurvey(hxSurvey.id(3))
            .then(() => hxSurvey.remove(3));
    });

    [7, 10, 14, 21, 22, 24].forEach((questionIndex, index) => {
        it(`replace question ${questionIndex} with question ${20 + index}`, function () {
            const replacement = generator.newQuestion();
            return Question.replaceQuestion(hxQuestion.id(questionIndex), replacement)
                .then(({ id }) => Question.getQuestion(id))
                .then(question => {
                    comparator.question(replacement, question);
                    hxQuestion.replace(questionIndex, replacement, question);
                    return question;
                })
                .then(() => Question.listQuestions())
                .then(questions => comparator.questions(hxQuestion.listClients(), questions));
        });
    });

    const verifyVersioningFn = function (index, expectedVersion) {
        return function () {
            const id = hxQuestion.id(index);
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

    it('verify versioning for question 25', verifyVersioningFn(25, 4));
    it('verify versioning for question 23', verifyVersioningFn(23, 3));
    it('verify versioning for question 20', verifyVersioningFn(20, 2));
});