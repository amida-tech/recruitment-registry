/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const Answerer = require('./util/generator/answerer');
const comparator = require('./util/comparator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const answerCommon = require('./util/answer-common');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('answer unit', function () {
    const testQuestions = answerCommon.testQuestions;

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxChoiceSet = new History();

    const tests = new answerCommon.SpecTests(generator, hxUser, hxSurvey, hxQuestion);
    const hxAnswers = tests.hxAnswer;

    const questionTests = new questionCommon.SpecTests(generator, hxQuestion);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    before(shared.setUpFn());

    const userCount = 3;
    for (let i = 0; i <= userCount; ++i) {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, questionTests.createQuestionFn());
        it(`get question ${i}`, questionTests.getQuestionFn(i));
    }

    const createSurveyFn = function (qxIndices) {
        return function () {
            const inputSurvey = generator.newSurvey();
            delete inputSurvey.sections;
            inputSurvey.questions = qxIndices.map(index => ({
                id: hxQuestion.server(index).id,
                required: false
            }));
            return models.survey.createSurvey(inputSurvey)
                .then(id => {
                    hxSurvey.push(inputSurvey, { id });
                });
        };
    };

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, createSurveyFn(surveyQuestion));
    });

    it('error: invalid answer property', function () {
        const input = {
            userId: hxUser.id(0),
            surveyId: hxSurvey.id(0),
            answers: [{
                questionId: hxQuestion.id(0),
                answer: {
                    invalidValue: 'invalidValue'
                }
            }]
        };
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerAnswerNotUnderstood', 'invalidValue'));
    });

    it('error: multiple answer properties', function () {
        const input = {
            userId: hxUser.id(0),
            surveyId: hxSurvey.id(0),
            answers: [{
                questionId: hxQuestion.id(0),
                answer: {
                    invalidValue1: 'invalidValue1',
                    invalidValue0: 'invalidValue0'
                }
            }]
        };
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerMultipleTypeAnswers', 'invalidValue0, invalidValue1'));
    });

    const listAnswersFn = function (userIndex, surveyIndex) {
        return function () {
            return models.answer.listAnswers({
                    userId: hxUser.id(userIndex),
                    surveyId: hxSurvey.id(surveyIndex),
                    scope: 'history-only',
                    history: true
                })
                .then((actual) => {
                    actual = _.groupBy(actual, 'deletedAt');
                    Object.keys(actual).forEach(key => actual[key].forEach(value => delete value.deletedAt));
                    const expectedAnswers = hxAnswers.expectedRemovedAnswers(userIndex, surveyIndex);
                    const expectedKeys = _.sortBy(Object.keys(expectedAnswers), r => Number(r));
                    const actualKeys = _.sortBy(Object.keys(actual), r => Number(r));
                    expect(actualKeys.length).to.equal(expectedKeys.length);
                    for (let i = 0; i < expectedKeys.length; ++i) {
                        comparator.answers(expectedAnswers[expectedKeys[i]], actual[actualKeys[i]]);
                    }
                });
        };
    };

    const cases = [
        { userIndex: 0, surveyIndex: 0, seqIndex: 0 },
        { userIndex: 1, surveyIndex: 1, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 2, seqIndex: 0 },
        { userIndex: 3, surveyIndex: 3, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 4, seqIndex: 0 },
        { userIndex: 0, surveyIndex: 3, seqIndex: 1 },
    ];

    for (let i = 0; i < cases.length; ++i) {
        const { userIndex, surveyIndex, seqIndex } = cases[i];
        const questionIndices = testQuestions[surveyIndex].answerSequences[seqIndex][0];
        it(`user ${userIndex} answers survey ${surveyIndex} (step 0)`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
        it(`user ${userIndex} gets answers to survey ${surveyIndex} (step 0)`, tests.getAnswersFn(userIndex, surveyIndex));
    }

    for (let j = 1; j < 3; ++j) {
        for (let i = 0; i < cases.length; ++i) {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            const questionIndices = testQuestions[surveyIndex].answerSequences[seqIndex][j];
            it(`user ${userIndex} answers survey ${surveyIndex} (step ${j})`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
            it(`user ${userIndex} gets answers to survey ${surveyIndex} (step ${j})`, tests.getAnswersFn(userIndex, surveyIndex));
            it('list user ${userIndex} survey ${surveyIndex} answer history (step ${j})', listAnswersFn(userIndex, surveyIndex));
        }
    }

    it('create question 20 (choices of all types)', function () {
        const question = generator.questionGenerator.allChoices();
        return questionTests.createQuestionFn(question)();
    });
    it('get question 20', questionTests.getQuestionFn(20));
    it(`create survey ${testQuestions.length}`, createSurveyFn([20]));
    it('replace choices type answer generator to answer all choices', function () {
        generator.updateAnswererClass(answerCommon.AllChoicesAnswerer);
    });
    it(`user 3 answers survey 5`, tests.answerSurveyFn(3, 5, [20]));
    it(`user 3 gets answers to survey 5`, tests.getAnswersFn(3, 5));

    it('create question 21 (choices with bool-sole)', function () {
        const question = generator.questionGenerator.boolSoleChoices();
        return questionTests.createQuestionFn(question)();
    });
    it('get question 21', questionTests.getQuestionFn());
    it(`create survey ${testQuestions.length+1}`, createSurveyFn([21]));
    it('replace choices type answer generator to answer with bool-sole', function () {
        generator.updateAnswererClass(answerCommon.BoolSoleChoicesAnswerer);
    });
    it(`user 3 answers survey 6`, tests.answerSurveyFn(3, 6, [21]));
    it(`user 3 gets answers to survey 6`, tests.getAnswersFn(3, 6));

    _.range(22, 34).forEach(index => {
        it(`create question ${index} (multi)`, function () {
            const question = generator.questionGenerator.newMultiQuestion();
            return questionTests.createQuestionFn(question)();
        });
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });
    _.range(34, 52).forEach(index => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 7 (1 multi)', createSurveyFn([22, 34, 35, 36]));
    it('create survey 8 (2 multi)', createSurveyFn([37, 23, 38, 39, 24]));
    it('create survey 9 (3 multi)', createSurveyFn([25, 40, 41, 42, 26, 27]));
    it('create survey 10 (1 multi)', createSurveyFn([43, 44, 28, 45]));
    it('create survey 11 (2 multi)', createSurveyFn([46, 29, 30, 47, 48]));
    it('create survey 12 (3 multi)', createSurveyFn([31, 49, 32, 50, 33, 51]));

    it('switch back to generic answerer', function () {
        generator.updateAnswererClass(Answerer);
    });

    it(`user 3 answers survey 7`, tests.answerSurveyFn(3, 7, [22, 34, 35, 36]));
    it(`user 3 gets answers to survey 7`, tests.getAnswersFn(3, 7));
    it(`user 2 answers survey 8`, tests.answerSurveyFn(2, 8, [37, 23, 38, 39, 24]));
    it(`user 2 gets answers to survey 8`, tests.getAnswersFn(2, 8));
    it(`user 1 answers survey 9`, tests.answerSurveyFn(1, 9, [25, 40, 41, 42, 26, 27]));
    it(`user 1 gets answers to survey 9`, tests.getAnswersFn(1, 9));
    it(`user 0 answers survey 10`, tests.answerSurveyFn(0, 10, [43, 44, 28, 45]));
    it(`user 0 gets answers to survey 10`, tests.getAnswersFn(0, 10));
    it(`user 1 answers survey 11`, tests.answerSurveyFn(1, 11, [46, 29, 30, 47, 48]));
    it(`user 1 gets answers to survey 11`, tests.getAnswersFn(1, 11));
    it(`user 2 answers survey 12`, tests.answerSurveyFn(2, 12, [31, 49, 32, 50, 33, 51]));
    it(`user 2 gets answers to survey 12`, tests.getAnswersFn(2, 12));

    _.range(8).forEach(index => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', function () {
        const choiceSets = _.range(8).map(index => hxChoiceSet.server(index));
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(generator.questionGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(52, 62).forEach(index => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 13 (5 choice sets)', createSurveyFn([52, 53, 54, 55, 56]));
    it('create survey 14 (5 choice sets)', createSurveyFn([57, 58, 59, 60, 61]));

    it(`user 3 answers survey 13`, tests.answerSurveyFn(3, 13, [52, 53, 54, 55, 56]));
    it(`user 3 gets answers to survey 13`, tests.getAnswersFn(3, 13));
    it(`user 2 answers survey 14`, tests.answerSurveyFn(2, 14, [57, 58, 59, 60, 61]));
    it(`user 2 gets answers to survey 14`, tests.getAnswersFn(2, 14));

    // multi survey and choice set survey
    const searchCases = [{
            surveyIdx: 10,
            qxIndices: [43, 44, 28, 45]
        },
        {
            surveyIdx: 13,
            qxIndices: [52, 53, 54, 55, 56]
        }
    ];
    const searchCountUsers = function searchCountUsers(query) {
        return models.answer.searchCountUsers(query);
    };
    const searchCountFromAnswers = function searchCountFromAnswers(answers) {
        return searchCountUsers(answerCommon.answersToSearchQuery(answers));
    };
    const generateAnswersFn = function generateAnswersFn(surveyIdx, qxIndices) {
        return () => answerCommon.generateAnswers(generator, hxSurvey.server(surveyIdx), hxQuestion, qxIndices);
    };
    const saveAnswersFn = function saveAnswersFn(surveyIdx) {
        return (userIdx, answers) => {
            const userId = hxUser.id(userIdx);
            const surveyId = hxSurvey.server(surveyIdx).id;
            return models.answer.createAnswers({ userId, surveyId, answers });
        };
    };

    searchCases.forEach(({ surveyIdx, qxIndices }) => {
        let searchAnswersOne, searchAnswersTwo;
        const generateAnswers = generateAnswersFn(surveyIdx, qxIndices);
        const saveAnswers = saveAnswersFn(surveyIdx);

        it(`users answer survey ${surveyIdx} for search`, function () {
            // ensure intersection in answers
            searchAnswersOne = generateAnswers();
            searchAnswersTwo = generateAnswers();
            for (let [index, answer] of searchAnswersTwo.entries()) {
                if (answer.questionId === searchAnswersOne[0].questionId) {
                    searchAnswersTwo[index] = searchAnswersOne[0];
                }
                break;
            }

            return Promise.all([
                saveAnswers(1, searchAnswersOne),
                saveAnswers(2, searchAnswersTwo)
            ]);
        });

        it(`search survey ${surveyIdx} to find all users`, function () {
            return searchCountUsers({ questions: [] }).then(count => expect(count).to.be.at.least(userCount));
        });

        it(`search survey ${surveyIdx} to find a single user`, function () {
            return searchCountFromAnswers(searchAnswersOne).then(count => expect(count).to.equal(1));
        });

        // assumes there is a nonzero intersection in the two answer sets
        it(`search survey ${surveyIdx} to find both user`, function () {
            return searchCountFromAnswers(_.intersectionWith(searchAnswersOne, searchAnswersTwo, _.isEqual))
                .then(count => expect(count).to.equal(2));
        });

        it(`search survey ${surveyIdx} to find no users`, function () {
            // find questions answered differently by the two users
            const answersTwo = new Map();
            searchAnswersTwo.forEach(answer => answersTwo.set(answer.questionId, answer));

            const answersOne = searchAnswersOne.slice();
            for (let [index, answer] of searchAnswersOne.entries()) {
                if (!_.isEqual(answersTwo.get(answer.questionId), answer)) {
                    answersOne[index] = answersTwo.get(answer.questionId);
                    break;
                }
            }

            return searchCountFromAnswers(answersOne).then(count => expect(count).to.equal(0));
        });
    });

    it(`search multi question 23 with multiple answer options`, function () {
        const surveyIdx = 8;
        const generateAnswers = generateAnswersFn(surveyIdx, [24]);
        const answers = generateAnswers();
        const answersPossible = generateAnswers();
        const searchInput = [{
            questionId: answers[0].questionId,
            answers: answers[0].answers.concat(answersPossible[0].answers)
        }];

        return saveAnswersFn(surveyIdx)(1, answers).then(() => {
            return searchCountFromAnswers(searchInput)
                .then(count => expect(count).to.equal(1));
        });
    });

    it(`error: question specified multiple times in search criteria`, function () {
        const generateAnswers = generateAnswersFn(8, [23]);
        const searchInput = [...generateAnswers(), ...generateAnswers()];
        return searchCountFromAnswers(searchInput)
            .then(shared.throwingHandler, shared.expectedErrorHandler('searchQuestionRepeat'));
    });
});
