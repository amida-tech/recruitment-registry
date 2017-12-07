/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const config = require('../config');
const RRSuperTest = require('./util/rr-super-test');
const SharedIntegration = require('./util/shared-integration.js');
const Generator = require('./util/generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const surveyCommon = require('./util/survey-common');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');
const answerCommon = require('./util/answer-common');
const FilterGenerator = require('./util/generator/filter-generator');
const QuestionChoiceGenerator = require('./util/generator/question-choice-generator');

const expect = chai.expect;

describe('question choice integration', () => {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const filterGenerator = new FilterGenerator();
    const qxChoiceGenerator = new QuestionChoiceGenerator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxQuestion = new History();
    const hxChoiceSet = new History();
    const hxSurvey = new History();
    const hxUser = new History();
    const questionTests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });
    const choiceSetTests = new choiceSetCommon.IntegrationTests(rrSuperTest, generator, hxChoiceSet);
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxQuestion);
    const opt = { generator, hxUser, hxSurvey, hxQuestion };
    const answerTests = new answerCommon.IntegrationTests(rrSuperTest, opt);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(3).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(10).forEach((index) => {
        const type = (index % 2) === 0 ? 'choice' : 'choices';
        const options = { type, noText: true };
        it(`create question ${index}`, questionTests.createQuestionFn(options));
        it(`get question ${index}`, questionTests.getQuestionFn(index));
        const choiceIndex = index % 3;
        it(`patch question ${index} choice ${choiceIndex}`, function patchQuestionChoice() {
            const choice = qxChoiceGenerator.newQuestionChoice();
            const question = hxQuestion.server(index);
            choice.questionId = question.id;
            const id = question.choices[choiceIndex].id;
            return rrSuperTest.patch(`/question-choices/${id}`, choice, 204)
                .then(() => {
                    delete choice.questionId;
                    if (choice.type === 'choices') {
                        choice.type = choice.type || 'bool';
                    }
                    Object.assign(question.choices[choiceIndex], choice);
                });
        });
        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    _.range(3).forEach((index) => {
        it(`create choice set ${index}`, choiceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choiceSetTests.getChoiceSetFn(index));
        const choiceIndex = index % 3;
        it(`patch choice set ${index} choice ${choiceIndex}`, function patchSetChoice() {
            const choice = qxChoiceGenerator.newQuestionChoice();
            const choiceSet = hxChoiceSet.server(index);
            choice.choiceSetId = choiceSet.id;
            const id = choiceSet.choices[choiceIndex].id;
            return rrSuperTest.patch(`/question-choices/${id}`, choice, 204)
                .then(() => {
                    delete choice.choiceSetId;
                    Object.assign(choiceSet.choices[choiceIndex], choice);
                });
        });
        it(`verify choice set ${index}`, choiceSetTests.verifyChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(3).map(index => hxChoiceSet.server(index));
        const qxGenerator = generator.questionGenerator;
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(qxGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(10, 20).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    [10, 11].forEach((qxIndex, index) => {
        it(`verify question ${qxIndex} is from choice set index`, function verifyChoiceFromSet() {
            const qxChoiceIds = hxQuestion.server(qxIndex).choices.map(({ id }) => id);
            const setChoiceIds = hxChoiceSet.server(index).choices.map(({ id }) => id);
            expect(qxChoiceIds).to.deep.equal(setChoiceIds);
        });
    });

    [
        [0, 1, 10],
        [2, 3, 11],
    ].forEach((qxIndices, index) => {
        it(`create survey ${index}`, surveyTests.createSurveyQxHxFn(qxIndices));
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    it('user 0 answers survey 0', answerTests.answerSurveyFn(0, 0, [0, 1, 10]));

    let answeredQxChoiceIds;
    it('get some question choices that are answers', function getQxChoicesInAnswers() {
        const answers = answerTests.hxAnswer.expectedAnswers(0, 0);
        answeredQxChoiceIds = answers.map(({ answer }) => (answer.choice || answer.choices[0].id));
    });

    const errorNoDeleteAnsweredFn = function (index) {
        return function errorNoDeleteAnswerChoice() {
            const choice = answeredQxChoiceIds[index];
            return rrSuperTest.delete(`/question-choices/${choice}`, 400)
                .then(res => shared.verifyErrorMessage(res, 'qxChoiceNoDeleteAnswered'));
        };
    };

    _.range(3).forEach((index) => {
        it(`error: cannot delete answered choice case ${index}`, errorNoDeleteAnsweredFn(index));
    });

    it('delete survey 0', surveyTests.deleteSurveyFn(0));

    _.range(3).forEach((index) => {
        it(`delete choice case ${index}`, function deleteChoice() {
            const choice = answeredQxChoiceIds[index];
            return rrSuperTest.delete(`/question-choices/${choice}`, 204);
        });

        it(`update question ${[0, 1, 10][index]} local copy`, function updateQuestion() {
            const qxIndex = [0, 1, 10][index];
            const question = hxQuestion.server(qxIndex);
            const choiceId = answeredQxChoiceIds[index];
            question.choices = question.choices.filter(choice => choice.id !== choiceId);
        });
    });

    _.range(13, 20, 3).forEach((index) => {
        it(`update question ${index} local copy`, function updateQuestion() {
            const question = hxQuestion.server(index);
            const choiceId = answeredQxChoiceIds[2];
            question.choices = question.choices.filter(choice => choice.id !== choiceId);
        });
    });

    _.range(1).forEach((index) => {
        it(`update choice set ${index} local copy`, function updateChoiceSet() {
            const choiceSet = hxChoiceSet.server(index);
            const choiceId = answeredQxChoiceIds[2];
            choiceSet.choices = choiceSet.choices.filter(choice => choice.id !== choiceId);
        });
    });

    const qxChoicesInFilters = [];
    let filterId;
    it('create filter 0', function createFilter() {
        const questions = [2, 3, 11].map((qxIndex) => {
            const server = hxQuestion.server(qxIndex);
            const question = { id: server.id };
            const choice = server.choice || server.choices[0].id;
            question.answers = [{ choice }];
            qxChoicesInFilters.push(choice);
            return question;
        });
        const filter = filterGenerator.newFilterQuestionsReady(questions);
        return rrSuperTest.post('/filters', filter, 201)
            .then((res) => { filterId = res.body.id; });
    });

    const errorNoDeleteInFilterFn = function (index) {
        return function errorNoDeleteInFilter() {
            const choice = qxChoicesInFilters[index];
            return rrSuperTest.delete(`/question-choices/${choice}`, 400)
                .then(res => shared.verifyErrorMessage(res, 'qxChoiceNoDeleteInFilter'));
        };
    };

    _.range(3).forEach((index) => {
        it(`error: cannot delete choice in filter case ${index}`, errorNoDeleteInFilterFn(index));
    });

    it('delete filter 0', function deleteFilter() {
        return rrSuperTest.delete(`/filters/${filterId}`, 204);
    });

    _.range(3).forEach((index) => {
        it(`delete choice case ${index}`, function deleteChoice() {
            const choice = qxChoicesInFilters[index];
            return rrSuperTest.delete(`/question-choices/${choice}`, 204);
        });

        it(`update question ${[2, 3, 11][index]} local copy`, function updateQuestion() {
            const qxIndex = [2, 3, 11][index];
            const question = hxQuestion.server(qxIndex);
            const choiceId = qxChoicesInFilters[index];
            question.choices = question.choices.filter(choice => choice.id !== choiceId);
        });
    });

    _.range(14, 20, 3).forEach((index) => {
        it(`update question ${index} local copy`, function updateQuestion() {
            const question = hxQuestion.server(index);
            const choiceId = qxChoicesInFilters[2];
            question.choices = question.choices.filter(choice => choice.id !== choiceId);
        });
    });

    _.range(1, 2).forEach((index) => {
        it(`update choice set ${index} local copy`, function updateChoiceSet() {
            const choiceSet = hxChoiceSet.server(index);
            const choiceId = qxChoicesInFilters[2];
            choiceSet.choices = choiceSet.choices.filter(choice => choice.id !== choiceId);
        });
    });

    [0, 1, 2, 3, 10, 11].forEach((index) => {
        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    [0, 1].forEach((index) => {
        it(`verify choice set ${index}`, choiceSetTests.verifyChoiceSetFn(index));
    });

    _.range(10).forEach((index) => {
        it(`append choice to question ${index}`, function appendQuestionChoice() {
            const server = hxQuestion.server(index);
            const choice = qxChoiceGenerator.newQuestionChoice();
            choice.questionId = server.id;
            return rrSuperTest.post('/question-choices', choice, 201)
                .then((res) => {
                    delete choice.questionId;
                    if (server.type === 'choices') {
                        choice.type = choice.type || 'bool';
                    }
                    server.choices.push(Object.assign(res.body, choice));
                });
        });

        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    _.range(3).forEach((index) => {
        it(`append choice to choice set ${index}`, function appendSetChoice() {
            const server = hxChoiceSet.server(index);
            const choice = qxChoiceGenerator.newQuestionChoice({ alwaysCode: true });
            choice.choiceSetId = server.id;
            return rrSuperTest.post('/question-choices', choice, 201)
                .then((res) => {
                    delete choice.choiceSetId;
                    const choiceWithId = Object.assign(res.body, choice);
                    server.choices.push(choiceWithId);

                    _.range(10 + index, 20, 3).forEach((qxIndex) => {
                        const question = hxQuestion.server(qxIndex);
                        question.choices.push(choiceWithId);
                    });
                });
        });

        it(`verify choice set ${index}`, choiceSetTests.verifyChoiceSetFn(index));
    });

    _.range(10, 20).forEach((index) => {
        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    _.range(10).forEach((index) => {
        it(`insert choice to question ${index}`, function appendQuestionChoice() {
            const server = hxQuestion.server(index);
            const choice = qxChoiceGenerator.newQuestionChoice();
            choice.questionId = server.id;
            const beforeIndex = (index % 2) + 2;
            choice.before = server.choices[beforeIndex].id;
            return rrSuperTest.post('/question-choices', choice, 201)
                .then((res) => {
                    delete choice.questionId;
                    delete choice.before;
                    if (server.type === 'choices') {
                        choice.type = choice.type || 'bool';
                    }
                    server.choices.splice(beforeIndex, 0, Object.assign(res.body, choice));
                });
        });

        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    _.range(3).forEach((index) => {
        it(`insert choice to choice set ${index}`, function appendSetChoice() {
            const server = hxChoiceSet.server(index);
            const choice = qxChoiceGenerator.newQuestionChoice({ alwaysCode: true });
            choice.choiceSetId = server.id;
            const beforeIndex = (index % 2) + 2;
            choice.before = server.choices[beforeIndex].id;
            return rrSuperTest.post('/question-choices', choice, 201)
                .then((res) => {
                    delete choice.choiceSetId;
                    delete choice.before;
                    const choiceWithId = Object.assign(res.body, choice);
                    server.choices.splice(beforeIndex, 0, choiceWithId);

                    _.range(10 + index, 20, 3).forEach((qxIndex) => {
                        const question = hxQuestion.server(qxIndex);
                        question.choices.splice(beforeIndex, 0, choiceWithId);
                    });
                });
        });

        it(`verify choice set ${index}`, choiceSetTests.verifyChoiceSetFn(index));
    });

    _.range(10, 20).forEach((index) => {
        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    _.range(10).forEach((index) => {
        it(`insert/patch choice in question ${index}`, function patchQuestionChoice() {
            const server = hxQuestion.server(index);
            const choice = qxChoiceGenerator.newQuestionChoice();
            choice.questionId = server.id;
            const beforeIndex = (index % 2) + 1;
            choice.before = server.choices[beforeIndex].id;
            const patchIndex = server.choices.length - (index % 2) - 1;
            const id = server.choices[patchIndex].id;
            return rrSuperTest.patch(`/question-choices/${id}`, choice, 204)
                .then(() => {
                    delete choice.questionId;
                    delete choice.before;
                    const patchServer = Object.assign(server.choices[patchIndex], choice);
                    server.choices.splice(patchIndex, 1);
                    server.choices.splice(beforeIndex, 0, patchServer);
                });
        });

        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    _.range(3).forEach((index) => {
        it(`insert/patch choice in choice set ${index}`, function appendSetChoice() {
            const server = hxChoiceSet.server(index);
            const choice = qxChoiceGenerator.newQuestionChoice({ alwaysCode: true });
            choice.choiceSetId = server.id;
            const beforeIndex = (index % 2) + 1;
            choice.before = server.choices[beforeIndex].id;
            const patchIndex = server.choices.length - (index % 2) - 1;
            const id = server.choices[patchIndex].id;
            return rrSuperTest.patch(`/question-choices/${id}`, choice, 204)
                .then(() => {
                    delete choice.choiceSetId;
                    delete choice.before;
                    const patchServer = Object.assign(server.choices[patchIndex], choice);
                    server.choices.splice(patchIndex, 1);
                    server.choices.splice(beforeIndex, 0, patchServer);

                    _.range(10 + index, 20, 3).forEach((qxIndex) => {
                        const question = hxQuestion.server(qxIndex);
                        question.choices.splice(patchIndex, 1);
                        question.choices.splice(beforeIndex, 0, patchServer);
                    });
                });
        });

        it(`verify choice set ${index}`, choiceSetTests.verifyChoiceSetFn(index));
    });

    _.range(10, 20).forEach((index) => {
        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });

    it('logout as super', shared.logoutFn());
});
