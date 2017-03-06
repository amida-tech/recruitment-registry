/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');
const mkdirp = require('mkdirp');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/generator');
const SurveyHistory = require('../util/survey-history');
const History = require('../util/history');
const surveyCommon = require('../util/survey-common');
const answerCommon = require('../util/answer-common');

const generator = new Generator();
const shared = new SharedIntegration(generator);
const expect = chai.expect;

describe('answer import-export integration', () => {
    const rrSuperTest = new RRSuperTest();
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const answerTests = new answerCommon.IntegrationTests(rrSuperTest, generator, hxUser, hxSurvey);
    const hxAnswer = answerTests.hxAnswer;

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(rrSuperTest, hxUser));
    });

    _.range(4).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    it('logout as super', shared.logoutFn(rrSuperTest));

    _.range(4).forEach((index) => {
        it('login as user 0', shared.loginIndexFn(rrSuperTest, hxUser, 0));
        it(`user 0 answers survey ${index}`, answerTests.answerSurveyFn(0, index));
        it(`user 0 gets answered survey ${index}`, answerTests.verifyAnsweredSurveyFn(0, index));
        it('logout as user 0', shared.logoutFn(rrSuperTest));
    });

    const generatedDirectory = path.join(__dirname, '../generated');

    it('create output directory if necessary', (done) => {
        mkdirp(generatedDirectory, done);
    });

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

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

    it('logout as super', shared.logoutFn(rrSuperTest));

    it('login as user 0', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    it('list user 0 answers', answerTests.listAnswersForUserFn(0));

    it('export answers to csv', (done) => {
        rrSuperTest.get('/answers/csv', true, 200)
            .expect((res) => {
                const filepath = path.join(generatedDirectory, 'answer.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('logout as  user 0', shared.logoutFn(rrSuperTest));

    it('reset database', shared.setUpFn(rrSuperTest));

    it('reset user history', () => {
        hxUser.reset();
    });

    let questionIdMap;

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

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
        it(`create user ${i}`, shared.createUserFn(rrSuperTest, hxUser));
    });

    it('logout as super', shared.logoutFn(rrSuperTest));

    it('login as user 0', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    it('import answer csv into db', (done) => {
        const filepath = path.join(generatedDirectory, 'answer.csv');
        const questionidmap = JSON.stringify(questionIdMap);
        const surveyidmap = JSON.stringify(surveyIdMap);
        rrSuperTest.postFile('/answers/csv', 'answercsv', filepath, { questionidmap, surveyidmap }, 204)
            .end(done);
    });

    it('list imported answers and verify', (done) => {
        rrSuperTest.get('/answers/export', true, 200)
            .expect((res) => {
                const expected = hxAnswer.lastAnswers;
                expected.forEach((record) => {
                    const questionIdInfo = questionIdMap[record.questionId];
                    record.questionId = questionIdInfo.questionId;
                    if (record.questionChoiceId) {
                        const choicesIds = questionIdInfo.choicesIds;
                        record.questionChoiceId = choicesIds[record.questionChoiceId];
                    }
                });
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    it('logout as user 0', shared.logoutFn(rrSuperTest));
});
