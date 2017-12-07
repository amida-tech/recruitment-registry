/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

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
const surveyCommon = require('./util/survey-common');
const choiceSetCommon = require('./util/choice-set-common');
const answerSession = require('./fixtures/answer-session/survey-0');

const expect = chai.expect;

describe('answer integration', () => {
    const generator = new Generator();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);

    const hxUser = new History();
    const hxClinician = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxChoiceSet = new History();

    const opt = { generator, hxUser, hxSurvey, hxQuestion };
    const tests = new answerCommon.IntegrationTests(rrSuperTest, opt);

    const questionTests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxQuestion);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    it('create clinician', shared.createUserFn(hxClinician, null, { role: 'clinician' }));

    _.range(20).forEach((i) => {
        it(`create question ${i}`, questionTests.createQuestionFn());
        it(`get question ${i}`, questionTests.getQuestionFn(i));
    });

    const surveyOpts = { noneRequired: true };
    _.map(answerSession, 'survey').forEach((qxIndices, index) => {
        it(`create survey ${index}`, surveyTests.createSurveyQxHxFn(qxIndices, surveyOpts));
    });

    it('logout as super', shared.logoutFn());

    const cases = [
        { userIndex: 0, surveyIndex: 0, seqIndex: 0 },
        { userIndex: 1, surveyIndex: 1, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 2, seqIndex: 0 },
        { userIndex: 3, surveyIndex: 3, seqIndex: 0 },
        { userIndex: 2, surveyIndex: 4, seqIndex: 0 },
        { userIndex: 0, surveyIndex: 3, seqIndex: 1 },
    ];

    _.range(3).forEach((j) => {
        _.range(cases.length).forEach((i) => {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            const questionIndices = answerSession[surveyIndex].answerSequences[seqIndex][j];
            it(`login as user ${userIndex}`, shared.loginIndexFn(hxUser, userIndex));
            it(`user ${userIndex} answers survey ${surveyIndex} (step ${j})`, tests.answerSurveyFn(userIndex, surveyIndex, questionIndices));
            it(`user ${userIndex} gets answers to survey ${surveyIndex} (step ${j})`, tests.getAnswersFn(userIndex, surveyIndex));
            it(`logout as  user ${userIndex}`, shared.logoutFn());
        });
    });

    [0, 1].forEach((index) => {
        it('login as super', shared.loginFn(config.superUser));

        it(`create question ${20 + index}`, questionTests.createQuestionFn());
        it(`get question ${20 + index}`, questionTests.getQuestionFn(20 + index));
        it(`create survey ${answerSession.length + 1 + index}`, surveyTests.createSurveyQxHxFn([20 + index], surveyOpts));
        it('logout as super', shared.logoutFn());
        it('login as user 3', shared.loginIndexFn(hxUser, 3));

        it(`user 3 answers survey ${5 + index}`, tests.answerSurveyFn(3, 5 + index, [20 + index]));
        it(`user 3 gets answers to survey ${5 + index}`, tests.getAnswersFn(3, 5 + index));
        it('logout as  user 3', shared.logoutFn());
    });

    it('login as super', shared.loginFn(config.superUser));

    _.range(22, 34).forEach((index) => {
        const options = { multi: true };
        it(`create question ${index} (multi)`, questionTests.createQuestionFn(options));
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });
    _.range(34, 52).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 7 (1 multi)', surveyTests.createSurveyQxHxFn([22, 34, 35, 36], surveyOpts));
    it('create survey 8 (2 multi)', surveyTests.createSurveyQxHxFn([37, 23, 38, 39, 24], surveyOpts));
    it('create survey 9 (3 multi)', surveyTests.createSurveyQxHxFn([25, 40, 41, 42, 26, 27], surveyOpts));
    it('create survey 10 (1 multi)', surveyTests.createSurveyQxHxFn([43, 44, 28, 45], surveyOpts));
    it('create survey 11 (2 multi)', surveyTests.createSurveyQxHxFn([46, 29, 30, 47, 48], surveyOpts));
    it('create survey 12 (3 multi)', surveyTests.createSurveyQxHxFn([31, 49, 32, 50, 33, 51], surveyOpts));

    it('logout as super', shared.logoutFn());

    it('switch back to generic answerer', () => {
        generator.updateAnswererClass(Answerer);
    });

    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 answers survey 7', tests.answerSurveyFn(3, 7, [22, 34, 35, 36]));
    it('user 3 gets answers to survey 7', tests.getAnswersFn(3, 7));
    it('logout as  user 3', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 answers survey 8', tests.answerSurveyFn(2, 8, [37, 23, 38, 39, 24]));
    it('user 2 gets answers to survey 8', tests.getAnswersFn(2, 8));
    it('logout as  user 2', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 9', tests.answerSurveyFn(1, 9, [25, 40, 41, 42, 26, 27]));
    it('user 1 gets answers to survey 9', tests.getAnswersFn(1, 9));
    it('logout as  user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 10', tests.answerSurveyFn(0, 10, [43, 44, 28, 45]));
    it('user 0 gets answers to survey 10', tests.getAnswersFn(0, 10));
    it('logout as  user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 11', tests.answerSurveyFn(1, 11, [46, 29, 30, 47, 48]));
    it('user 1 gets answers to survey 11', tests.getAnswersFn(1, 11));
    it('logout as user 1', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    let answers;
    it('user 2 answers survey 12', () => tests.answerSurveyFn(2, 12, [31, 49, 32, 50, 33, 51])()
            .then((ans) => { answers = ans; }));
    it('user 2 gets answers to survey 12', tests.getAnswersFn(2, 12));
    it('error: search as user 2', (done) => {
        rrSuperTest.post('/answers/queries', answerCommon.answersToSearchQuery(answers), 403).end(done);
    });
    it('logout as user 2', shared.logoutFn());

    const verifySearch = function verifySearch(done) {
        rrSuperTest.post('/answers/queries', answerCommon.answersToSearchQuery(answers), 200)
            .expect((res) => {
                expect(res.body).to.have.all.keys('count');
                expect(res.body.count).to.equal(1);
            })
            .end(done);
    };
    it('login as clinician 0', shared.loginIndexFn(hxClinician, 0));
    it('search as clinician', verifySearch);
    it('logout as clinician', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('search as super', verifySearch);

    _.range(8).forEach((index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(8).map(index => hxChoiceSet.server(index));
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(generator.questionGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(52, 62).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    it('create survey 13 (5 choice sets)', surveyTests.createSurveyQxHxFn([52, 53, 54, 55, 56], surveyOpts));
    it('create survey 14 (5 choice sets)', surveyTests.createSurveyQxHxFn([57, 58, 59, 60, 61], surveyOpts));

    it('logout as super', shared.logoutFn());

    it('login as user 3', shared.loginIndexFn(hxUser, 3));
    it('user 3 answers survey 13', tests.answerSurveyFn(3, 13, [52, 53, 54, 55, 56]));
    it('user 3 gets answers to survey 13', tests.getAnswersFn(3, 13));
    it('logout as  user 3', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));
    it('user 2 answers survey 14', tests.answerSurveyFn(2, 14, [57, 58, 59, 60, 61]));
    it('user 2 gets answers to survey 14', tests.getAnswersFn(2, 14));
    it('logout as  user 2', shared.logoutFn());

    shared.verifyUserAudit();

    // it('release connections', shared.shutDownFn());
});
