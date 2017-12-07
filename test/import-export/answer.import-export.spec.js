/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/generator');
const SurveyHistory = require('../util/survey-history');
const History = require('../util/history');
const surveyCommon = require('../util/survey-common');
const answerCommon = require('../util/answer-common');
const intoStream = require('into-stream');

const expect = chai.expect;

describe('answer import-export unit', function answerIOSpec() {
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);
    const answerTests = new answerCommon.SpecTests({ generator, hxUser, hxSurvey });

    before(shared.setUpFn());

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    _.range(4).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    _.range(4).forEach((userIndex) => {
        _.range(4).forEach((index) => {
            const titleAnswer = `user ${userIndex} answers survey ${index}`;
            it(titleAnswer, answerTests.answerSurveyFn(userIndex, index));
            const titleVerify = `user ${userIndex} gets answered survey ${index}`;
            it(titleVerify, answerTests.verifyAnsweredSurveyFn(userIndex, index));
        });
    });

    let user0Answers;
    it('list user 0 answers', function listAnswersUser0() {
        return answerTests.listAnswersForUserFn(0)()
            .then((answers) => { user0Answers = answers; });
    });

    let users1And3Answers;
    it('list user 1, 3 answers', function listAnswersUser0() {
        return answerTests.listAnswersForUsersFn([1, 3])()
            .then((answers) => { users1And3Answers = answers; });
    });

    let questionCsvContent;
    let surveyCsvContent;
    let answerUser0CsvContent;
    let answerUser13CsvContent;

    it('export questions to csv', () => models.question.exportQuestions()
            .then((result) => { questionCsvContent = result; }));

    it('export surveys to csv', () => models.survey.exportSurveys()
            .then((result) => { surveyCsvContent = result; }));

    it('export user 0 answers to csv', () => {
        const userId = hxUser.id(0);
        return models.answer.exportForUser(userId)
            .then((result) => {
                expect(result).to.have.length.above(5); // make sure enough answers
                answerUser0CsvContent = result;
            });
    });

    it('export users 1, 3 answers to csv', () => {
        const userIds = [hxUser.id(1), hxUser.id(3)];
        return models.answer.exportForUsers(userIds)
            .then((result) => {
                expect(result).to.have.length.above(5); // make sure enough answers
                answerUser13CsvContent = result;
            });
    });

    it('reset database', shared.setUpFn());

    let originalUserIds;
    it('reset user history', function resetUserHistory() {
        originalUserIds = _.range(4).map(index => hxUser.id(index));
        hxUser.reset();
    });

    let questionIdMap;

    it('import question csv into db', () => {
        const stream = intoStream(questionCsvContent);
        return models.question.importQuestions(stream)
            .then((result) => { questionIdMap = result; });
    });

    let surveyIdMap;

    it('import survey csv into db', () => {
        const stream = intoStream(surveyCsvContent);
        return models.survey.importSurveys(stream, { questionIdMap })
            .then((result) => { surveyIdMap = result; });
    });

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    it('import user 0 answer csv into db', function importAnswersUser0() {
        const userId = hxUser.id(0);
        const stream = intoStream(answerUser0CsvContent);
        const maps = { userId, surveyIdMap, questionIdMap };
        return models.answer.importAnswers(stream, maps);
    });

    it('list imported user 0 answers and verify', function verifyUser0Answers() {
        const userId = hxUser.id(0);
        return models.answer.listAnswers({ scope: 'export', userId })
            .then((answers) => {
                const maps = { questionIdMap };
                answerCommon.compareImportedAnswers(answers, user0Answers, maps);
            });
    });

    let userIdMap;
    it('import user 1, 3 answer csv into db', function importAnswersUser1And3() {
        userIdMap = {
            [originalUserIds[1]]: hxUser.id(1),
            [originalUserIds[3]]: hxUser.id(2),
        };
        const stream = intoStream(answerUser13CsvContent);
        const maps = { userIdMap, surveyIdMap, questionIdMap };
        return models.answer.importAnswers(stream, maps);
    });

    it('list imported user 1, 3 answers and verify', function verifyUser1And3Answers() {
        const userIds = [hxUser.id(1), hxUser.id(2)];
        return models.answer.listAnswers({ scope: 'export', userIds })
            .then((answers) => {
                const maps = { userIdMap, questionIdMap };
                const actual = _.sortBy(answers, ['userId', 'surveyId']);
                answerCommon.compareImportedAnswers(actual, users1And3Answers, maps);
            });
    });
});
