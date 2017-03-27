/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/generator');
const SurveyHistory = require('../util/survey-history');
const History = require('../util/history');
const surveyCommon = require('../util/survey-common');
const answerCommon = require('../util/answer-common');
const intoStream = require('into-stream');

describe('answer import-export unit', function answerIOSpec() {
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);
    const answerTests = new answerCommon.SpecTests(generator, hxUser, hxSurvey);

    before(shared.setUpFn());

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    _.range(4).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    _.range(4).forEach((index) => {
        it(`user 0 answers survey ${index}`, answerTests.answerSurveyFn(0, index));
        it(`user 0 gets answered survey ${index}`, answerTests.verifyAnsweredSurveyFn(0, index));
    });

    let user0Answers;
    it('list user 0 answers', function listAnswersUser0() {
        return answerTests.listAnswersForUserFn(0)()
            .then((answers) => { user0Answers = answers; });
    });

    let questionCsvContent;
    let surveyCsvContent;
    let answerCsvContent;

    it('export questions to csv', () => models.question.exportQuestions()
            .then((result) => { questionCsvContent = result; }));

    it('export surveys to csv', () => models.survey.exportSurveys()
            .then((result) => { surveyCsvContent = result; }));

    it('export answers to csv', () => {
        const userId = hxUser.id(0);
        return models.answer.exportForUser(userId)
            .then((result) => { answerCsvContent = result; });
    });

    it('reset database', shared.setUpFn());

    it('reset user history', () => {
        hxUser.reset();
    });

    let questionIdMap;

    it('import question csv into db', () => {
        const stream = intoStream(questionCsvContent);
        return models.question.importQuestions(stream)
            .then((result) => { questionIdMap = result; });
    });

    let idMap;

    it('import survey csv into db', () => {
        const stream = intoStream(surveyCsvContent);
        return models.survey.importSurveys(stream, { questionIdMap })
            .then((result) => { idMap = result; });
    });

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    it('import answer csv into db', () => {
        const userId = hxUser.id(0);
        const stream = intoStream(answerCsvContent);
        return models.answer.importForUser(userId, stream, idMap, questionIdMap);
    });

    it('list imported answers and verify', function verifyUser0Answers() {
        const userId = hxUser.id(0);
        return models.answer.listAnswers({ scope: 'export', userId })
            .then((answers) => {
                const maps = { questionIdMap };
                answerCommon.compareImportedAnswers(answers, user0Answers, maps);
            });
    });
});
