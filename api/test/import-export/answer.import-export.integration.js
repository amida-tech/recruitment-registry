/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const mkdirp = require('mkdirp');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/entity-generator');
const SurveyHistory = require('../util/survey-history');
const History = require('../util/entity-history');
const MultiIndexStore = require('../util/multi-index-store');
const surveyCommon = require('../util/survey-common');
const answerCommon = require('../util/answer-common');

const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('answer import-export integration', function () {
    const rrSuperTest = new RRSuperTest();
    let hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxAnswer = new MultiIndexStore();
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);
    const answerTests = new answerCommon.SpecTests(generator, hxUser, hxSurvey, hxAnswer);

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(rrSuperTest, hxUser));
    }

    _.range(4).forEach(index => {
        it(`create survey ${index}`, surveyTests.createSurveyFn());
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    it('logout as super', shared.logoutFn(rrSuperTest));

    _.range(4).forEach(index => {
        it(`login as user ${index}`, shared.loginIndexFn(rrSuperTest, hxUser, index));
        it(`user 0 answers survey ${index}`, answerTests.answerSurveyFn(0, index));
        it(`user 0 gets answered survey ${index}`, answerTests.verifyAnsweredSurveyFn(0, index));
        it(`logout as  user ${index}`, shared.logoutFn(rrSuperTest));
    });

    const generatedDirectory = path.join(__dirname, '../generated');

    it('create output directory if necessary', function (done) {
        mkdirp(generatedDirectory, done);
    });

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    it('export questions to csv', function (done) {
        rrSuperTest.get('/questions/csv', true, 200)
            .expect(function (res) {
                const filepath = path.join(generatedDirectory, 'question.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('export surveys to csv', function (done) {
        rrSuperTest.get('/surveys/csv', true, 200)
            .expect(function (res) {
                const filepath = path.join(generatedDirectory, 'survey.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('logout as super', shared.logoutFn(rrSuperTest));

    it('login as user 0', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    it('export answers to csv', function (done) {
        rrSuperTest.get('/answers/csv', true, 200)
            .expect(function (res) {
                const filepath = path.join(generatedDirectory, 'answer.csv');
                fs.writeFileSync(filepath, res.text);
            })
            .end(done);
    });

    it('logout as  user 0', shared.logoutFn(rrSuperTest));

    it('reset database', shared.setUpFn(rrSuperTest));

    it('reset user history', function () {
        hxUser.reset();
    });

    let questionIdMap;

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    it('import question csv into db', function (done) {
        const filepath = path.join(generatedDirectory, 'question.csv');
        rrSuperTest.postFile('/questions/csv', 'questioncsv', filepath, null, 201)
            .expect(function (res) {
                questionIdMap = res.body;
            })
            .end(done);
    });

    let surveyIdMap;

    it('import survey csv into db', function (done) {
        const filepath = path.join(generatedDirectory, 'survey.csv');
        const questionidmap = JSON.stringify(questionIdMap);
        rrSuperTest.postFile('/surveys/csv', 'surveycsv', filepath, { questionidmap }, 201)
            .expect(function (res) {
                surveyIdMap = res.body;
            })
            .end(done);
    });

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(rrSuperTest, hxUser));
    }

    it('logout as super', shared.logoutFn(rrSuperTest));

    it('login as user 0', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    it('import answer csv into db', function (done) {
        const filepath = path.join(generatedDirectory, 'answer.csv');
        const questionidmap = JSON.stringify(questionIdMap);
        const surveyidmap = JSON.stringify(surveyIdMap);
        rrSuperTest.postFile('/answers/csv', 'answercsv', filepath, { questionidmap, surveyidmap }, 204)
            .end(done);
    });

    it('logout as user 0', shared.logoutFn(rrSuperTest));

    //it('list imported answers and verify', function () {
    //    const userId = hxUser.id(0);
    //    return models.answer.listAnswers({ scope: 'export', userId })
    //        .then(answers => {
    //            const expected = hxAnswer.lastAnswers;
    //            expected.forEach(record => {
    //                const questionIdInfo = questionIdMap[record.questionId];
    //                record.questionId = questionIdInfo.questionId;
    //                if (record.questionChoiceId) {
    //                    const choicesIds = questionIdInfo.choicesIds;
    //                    record.questionChoiceId = choicesIds[record.questionChoiceId];
    //                }
    //            });
    //            expect(answers).to.deep.equal(expected);
    //        });
    //});
});
