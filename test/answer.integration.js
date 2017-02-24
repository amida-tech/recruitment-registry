/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
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

describe('answer integration', function () {
    const generator = new Generator();
    const shared = new SharedIntegration(generator);

    const store = new RRSuperTest();

    const testQuestions = answerCommon.testQuestions;

    const hxUser = new History();
    const hxClinician = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxChoiceSet = new History();

    const tests = new answerCommon.IntegrationTests(store, generator, hxUser, hxSurvey, hxQuestion);

    const questionTests = new questionCommon.IntegrationTests(store, generator, hxQuestion);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(store, hxUser));
    }

    it(`create clinician`, shared.createUserFn(store, hxClinician, null, { role: 'clinician' }));

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, questionTests.createQuestionFn());
        it(`get question ${i}`, questionTests.getQuestionFn(i));
    }

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, shared.createSurveyFn(store, hxSurvey, hxQuestion, surveyQuestion));
    });

    it('logout as super', shared.logoutFn(store));

    const cases = [
        { userIndex: 0, surveyIndex: 0, seqIndex: 0 },
        { userIndex: 1, surveyIndex: 1, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 2, seqIndex: 0 },
        { userIndex: 3, surveyIndex: 3, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 4, seqIndex: 0 },
        { userIndex: 0, surveyIndex: 3, seqIndex: 1 },
    ];

    for (let j = 0; j < 3; ++j) {
        for (let i = 0; i < cases.length; ++i) {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            const questionIndices = testQuestions[surveyIndex].answerSequences[seqIndex][j];
            it(`login as user ${userIndex}`, shared.loginIndexFn(store, hxUser, userIndex));
            it(`user ${userIndex} answers survey ${surveyIndex} (step ${j})`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
            it(`user ${userIndex} gets answers to survey ${surveyIndex} (step ${j})`, tests.getAnswersFn(userIndex, surveyIndex));
            it(`logout as  user ${userIndex}`, shared.logoutFn(store));
        }
    }

    it('login as super', shared.loginFn(store, config.superUser));
    it('create question 20 (choices of all types)', function (done) {
        const question = generator.questionGenerator.allChoices();
        return questionTests.createQuestionFn(question)(done);
    });
    it('get question 20', questionTests.getQuestionFn(20));
    it(`create survey ${testQuestions.length}`, shared.createSurveyFn(store, hxSurvey, hxQuestion, [20]));
    it('replace choices type answer generator to answer all choices', function () {
        generator.updateAnswererClass(answerCommon.AllChoicesAnswerer);
    });
    it('logout as super', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`user 3 answers survey 5`, tests.answerSurveyFn(3, 5, [20]));
    it(`user 3 gets answers to survey 5`, tests.getAnswersFn(3, 5));
    it(`logout as  user 3`, shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it('create question 21 (choices with bool-sole)', function (done) {
        const question = generator.questionGenerator.boolSoleChoices();
        return questionTests.createQuestionFn(question)(done);
    });
    it('get question 21', questionTests.getQuestionFn());
    it(`create survey ${testQuestions.length+1}`, shared.createSurveyFn(store, hxSurvey, hxQuestion, [21]));
    it('replace choices type answer generator to answer with bool-sole', function () {
        generator.updateAnswererClass(answerCommon.BoolSoleChoicesAnswerer);
    });
    it('logout as super', shared.logoutFn(store));
    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));

    it(`user 3 answers survey 6`, tests.answerSurveyFn(3, 6, [21]));
    it(`user 3 gets answers to survey 6`, tests.getAnswersFn(3, 6));
    it(`logout as  user 3`, shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    _.range(22, 34).forEach(index => {
        it(`create question ${index} (multi)`, function (done) {
            const question = generator.questionGenerator.newMultiQuestion();
            return questionTests.createQuestionFn(question)(done);
        });
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });
    _.range(34, 52).forEach(index => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 7 (1 multi)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [22, 34, 35, 36]));
    it('create survey 8 (2 multi)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [37, 23, 38, 39, 24]));
    it('create survey 9 (3 multi)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [25, 40, 41, 42, 26, 27]));
    it('create survey 10 (1 multi)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [43, 44, 28, 45]));
    it('create survey 11 (2 multi)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [46, 29, 30, 47, 48]));
    it('create survey 12 (3 multi)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [31, 49, 32, 50, 33, 51]));

    it('logout as super', shared.logoutFn(store));

    it('switch back to generic answerer', function () {
        generator.updateAnswererClass(Answerer);
    });

    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`user 3 answers survey 7`, tests.answerSurveyFn(3, 7, [22, 34, 35, 36]));
    it(`user 3 gets answers to survey 7`, tests.getAnswersFn(3, 7));
    it(`logout as  user 3`, shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it(`user 2 answers survey 8`, tests.answerSurveyFn(2, 8, [37, 23, 38, 39, 24]));
    it(`user 2 gets answers to survey 8`, tests.getAnswersFn(2, 8));
    it(`logout as  user 2`, shared.logoutFn(store));

    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it(`user 1 answers survey 9`, tests.answerSurveyFn(1, 9, [25, 40, 41, 42, 26, 27]));
    it(`user 1 gets answers to survey 9`, tests.getAnswersFn(1, 9));
    it(`logout as  user 1`, shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it(`user 0 answers survey 10`, tests.answerSurveyFn(0, 10, [43, 44, 28, 45]));
    it(`user 0 gets answers to survey 10`, tests.getAnswersFn(0, 10));
    it(`logout as  user 0`, shared.logoutFn(store));

    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it(`user 1 answers survey 11`, tests.answerSurveyFn(1, 11, [46, 29, 30, 47, 48]));
    it(`user 1 gets answers to survey 11`, tests.getAnswersFn(1, 11));
    it(`logout as user 1`, shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    let answers;
    it(`user 2 answers survey 12`, function () {
        return tests.answerSurveyFn(2, 12, [31, 49, 32, 50, 33, 51])()
            .then(ans => answers = ans);
    });
    it(`user 2 gets answers to survey 12`, tests.getAnswersFn(2, 12));
    it('error: search as user 2', function (done) {
        store.post('/answers/queries', answerCommon.answersToSearchQuery(answers), 403).end(done);
    });
    it(`logout as user 2`, shared.logoutFn(store));

    const verifySearch = function verifySearch(done) {
        store.post('/answers/queries', answerCommon.answersToSearchQuery(answers), 200)
            .expect(function (res) {
                expect(res.body).to.have.all.keys('count');
                expect(res.body.count).to.equal(1);
            })
            .end(done);
    };
    it(`login as clinician 0`, shared.loginIndexFn(store, hxClinician, 0));
    it('search as clinician', verifySearch);
    it(`logout as clinician`, shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it('search as super', verifySearch);

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

    it('create survey 13 (5 choice sets)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [52, 53, 54, 55, 56]));
    it('create survey 14 (5 choice sets)', shared.createSurveyFn(store, hxSurvey, hxQuestion, [57, 58, 59, 60, 61]));

    it('logout as super', shared.logoutFn(store));

    it('login as user 3', shared.loginIndexFn(store, hxUser, 3));
    it(`user 3 answers survey 13`, tests.answerSurveyFn(3, 13, [52, 53, 54, 55, 56]));
    it(`user 3 gets answers to survey 13`, tests.getAnswersFn(3, 13));
    it(`logout as  user 3`, shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));
    it(`user 2 answers survey 14`, tests.answerSurveyFn(2, 14, [57, 58, 59, 60, 61]));
    it(`user 2 gets answers to survey 14`, tests.getAnswersFn(2, 14));
    it(`logout as  user 2`, shared.logoutFn(store));

    shared.verifyUserAudit(store);
});
