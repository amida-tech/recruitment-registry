/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const chai = require('chai');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/generator');
const SurveyHistory = require('../util/survey-history');
const History = require('../util/history');
const surveyCommon = require('../util/survey-common');
const answerCommon = require('../util/answer-common');

const expect = chai.expect;

describe('answer import-export integration', function answerIOIntegration() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const opt = { generator, hxUser, hxSurvey };
    const answerTests = new answerCommon.IntegrationTests(rrSuperTest, opt);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    _.range(4).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    it('logout as super', shared.logoutFn());

    _.range(4).forEach((userIndex) => {
        _.range(4).forEach((index) => {
            it(`login as user ${userIndex}`, shared.loginIndexFn(hxUser, userIndex));
            const titleAnswer = `user ${userIndex} answers survey ${index}`;
            it(titleAnswer, answerTests.answerSurveyFn(userIndex, index));
            const titleVerify = `user ${userIndex} gets answered survey ${index}`;
            it(titleVerify, answerTests.verifyAnsweredSurveyFn(userIndex, index));
            it(`logout as user ${userIndex}`, shared.logoutFn());
        });
    });

    const generatedDirectory = path.join(__dirname, '../generated');

    it('create output directory if necessary', (done) => {
        mkdirp(generatedDirectory, done);
    });

    it('login as super', shared.loginFn(config.superUser));

    it('export questions to csv', (done) => {
        rrSuperTest.get('/questions/csv', true, 200)
            .expect((res) => {
                const filepath = path.join(generatedDirectory, 'question.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('export surveys to csv', (done) => {
        rrSuperTest.get('/surveys/csv', true, 200)
            .expect((res) => {
                const filepath = path.join(generatedDirectory, 'survey.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));

    let user0Answers;
    it('list user 0 answers', function listAnswersUser0() {
        return answerTests.listAnswersForUserFn(0)()
            .then((answers) => {
                expect(answers).to.have.length.above(5); // make sure enough answers
                user0Answers = answers;
            });
    });

    it('logout as  user 0', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    let users1And3Answers;
    it('list user 1, 3 answers', function listAnswersUsers1And3() {
        return answerTests.listAnswersForUsersFn([1, 3])()
            .then((answers) => {
                expect(answers).to.have.length.above(5); // make sure enough answers
                users1And3Answers = answers;
            });
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));

    it('export user 0 answers to csv', (done) => {
        rrSuperTest.get('/answers/csv', true, 200)
            .expect((res) => {
                const filepath = path.join(generatedDirectory, 'answer.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('logout as  user 0', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    it('export users 1, 3 answers to csv', (done) => {
        const userIds = [hxUser.id(1), hxUser.id(3)];
        rrSuperTest.get('/answers/multi-user-csv', true, 200, { 'user-ids': userIds })
            .expect((res) => {
                const filepath = path.join(generatedDirectory, 'answer-multi.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('logout as super', shared.logoutFn());

    it('reset database', shared.setUpFn());

    let originalUserIds;
    it('reset user history', function resetUserHistory() {
        originalUserIds = _.range(4).map(index => hxUser.id(index));
        hxUser.reset();
    });

    let questionIdMap;

    it('login as super', shared.loginFn(config.superUser));

    it('import question csv into db', (done) => {
        const filepath = path.join(generatedDirectory, 'question.csv');
        rrSuperTest.postFile('/questions/csv', 'questioncsv', filepath, null, 201)
            .expect((res) => {
                questionIdMap = res.body;
            })
            .end(done);
    });

    let surveyIdMap;

    it('import survey csv into db', (done) => {
        const filepath = path.join(generatedDirectory, 'survey.csv');
        const questionidmap = JSON.stringify(questionIdMap);
        rrSuperTest.postFile('/surveys/csv', 'surveycsv', filepath, { questionidmap }, 201)
            .expect((res) => {
                surveyIdMap = res.body;
            })
            .end(done);
    });

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));

    it('import answer csv into db', (done) => {
        const filepath = path.join(generatedDirectory, 'answer.csv');
        const questionidmap = JSON.stringify(questionIdMap);
        const surveyidmap = JSON.stringify(surveyIdMap);
        rrSuperTest.postFile('/answers/csv', 'answercsv', filepath, { questionidmap, surveyidmap }, 204)
            .end(done);
    });

    it('list imported answers and verify', function verifyUser0Answers() {
        return rrSuperTest.get('/answers/export', true, 200)
            .then((res) => {
                const maps = { questionIdMap };
                answerCommon.compareImportedAnswers(res.body, user0Answers, maps);
            });
    });

    it('logout as user 0', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    let userIdMap;
    it('import user 1, 3 answer csv into db', function importAnswersUser1And3() {
        userIdMap = {
            [originalUserIds[1]]: hxUser.id(1),
            [originalUserIds[3]]: hxUser.id(2),
        };
        const filepath = path.join(generatedDirectory, 'answer-multi.csv');
        const questionidmap = JSON.stringify(questionIdMap);
        const surveyidmap = JSON.stringify(surveyIdMap);
        const useridmap = JSON.stringify(userIdMap);
        const maps = { useridmap, surveyidmap, questionidmap };
        return rrSuperTest.postFile('/answers/multi-user-csv', 'answercsv', filepath, maps, 204);
    });

    it('list imported user 1, 3 answers and verify', function verifyUser1And3Answers() {
        const userIds = [hxUser.id(1), hxUser.id(2)];
        const query = { 'user-ids': userIds };
        return rrSuperTest.get('/answers/multi-user-export', true, 200, query)
             .then((res) => {
                 const maps = { userIdMap, questionIdMap };
                 const actual = _.sortBy(res.body, ['userId', 'surveyId']);
                 answerCommon.compareImportedAnswers(actual, users1And3Answers, maps);
             });
    });

    it('logout as super', shared.logoutFn());
});
