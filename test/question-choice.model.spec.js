/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const surveyCommon = require('./util/survey-common');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');
const answerCommon = require('./util/answer-common');
const FilterGenerator = require('./util/generator/filter-generator');

describe('question choice unit', () => {
    const generator = new Generator();
    const filterGenerator = new FilterGenerator();
    const shared = new SharedSpec(generator);
    const hxQuestion = new History();
    const hxChoiceSet = new History();
    const hxSurvey = new History();
    const hxUser = new History();
    const questionTests = new questionCommon.SpecTests(generator, hxQuestion);
    const choiceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);
    const answerTests = new answerCommon.SpecTests(generator, hxUser, hxSurvey, hxQuestion);

    before(shared.setUpFn());

    _.range(3).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(10).forEach((index) => {
        const type = (index % 2) === 0 ? 'choice' : 'choices';
        const question = generator.newQuestion(type, { noText: true });
        it(`create question ${index}`, questionTests.createQuestionFn(question));
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    _.range(3).forEach((index) => {
        it(`create choice set ${index}`, choiceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choiceSetTests.getChoiceSetFn(index));
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
            return models.questionChoice.deleteQuestionChoice(choice)
                .then(shared.throwingHandler)
                .catch(shared.expectedErrorHandler('qxChoiceNoDeleteAnswered'));
        };
    };

    _.range(3).forEach((index) => {
        it(`error: cannot delete answered choice case ${index}`, errorNoDeleteAnsweredFn(index));
    });

    it('delete survey 0', surveyTests.deleteSurveyFn(0));

    _.range(3).forEach((index) => {
        it(`delete choice case ${index}`, function deleteChoice() {
            const choice = answeredQxChoiceIds[index];
            return models.questionChoice.deleteQuestionChoice(choice);
        });
        it(`update question ${[0, 1, 10][index]} local copy`, function updateQuestion() {
            const qxIndex = [0, 1, 10][index];
            const question = hxQuestion.server(qxIndex);
            const choiceId = answeredQxChoiceIds[index];
            question.choices = question.choices.filter(choice => choice.id !== choiceId);
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
        return models.filter.createFilter(filter).then(({ id }) => { filterId = id; });
    });

    const errorNoDeleteInFilterFn = function (index) {
        return function errorNoDeleteInFilter() {
            const choice = qxChoicesInFilters[index];
            return models.questionChoice.deleteQuestionChoice(choice)
                .then(shared.throwingHandler)
                .catch(shared.expectedErrorHandler('qxChoiceNoDeleteInFilter'));
        };
    };

    _.range(3).forEach((index) => {
        it(`error: cannot delete choice in filter case ${index}`, errorNoDeleteInFilterFn(index));
    });

    it('delete filter 0', function deleteFilter() {
        return models.filter.deleteFilter(filterId);
    });

    _.range(3).forEach((index) => {
        it(`delete choice case ${index}`, function deleteChoice() {
            const choice = qxChoicesInFilters[index];
            return models.questionChoice.deleteQuestionChoice(choice);
        });
        it(`update question ${[2, 3, 11][index]} local copy`, function updateQuestion() {
            const qxIndex = [2, 3, 11][index];
            const question = hxQuestion.server(qxIndex);
            const choiceId = qxChoicesInFilters[index];
            question.choices = question.choices.filter(choice => choice.id !== choiceId);
        });
    });

    [0, 1, 2, 3, 10, 11].forEach((index) => {
        it(`verify question ${index}`, questionTests.verifyQuestionFn(index));
    });
});
