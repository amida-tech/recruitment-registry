/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/generator');
const SurveyHistory = require('../util/survey-history');
const History = require('../util/history');
const surveyCommon = require('../util/survey-common');
const answerCommon = require('../util/answer-common');
const intoStream = require('into-stream');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('answer import-export unit', () => {
    before(shared.setUpFn());

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);
    const answerTests = new answerCommon.SpecTests(generator, hxUser, hxSurvey);
    const hxAnswer = answerTests.hxAnswer;

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    }

    _.range(4).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    _.range(4).forEach((index) => {
        it(`user 0 answers survey ${index}`, answerTests.answerSurveyFn(0, index));
        it(`user 0 gets answered survey ${index}`, answerTests.verifyAnsweredSurveyFn(0, index));
    });

    it('list user 0 answers', answerTests.listAnswersForUserFn(0));

    let questionCsvContent;
    let surveyCsvContent;
    let answerCsvContent;

    it('export questions to csv', () => models.question.export()
            .then(result => questionCsvContent = result));

    it('export surveys to csv', () => models.survey.export()
            .then(result => surveyCsvContent = result));

    it('export answers to csv', () => {
        const userId = hxUser.id(0);
        return models.answer.exportForUser(userId)
            .then(result => answerCsvContent = result);
    });

    it('reset database', shared.setUpFn());

    it('reset user history', () => {
        hxUser.reset();
    });

    let questionIdMap;

    it('import question csv into db', () => {
        const stream = intoStream(questionCsvContent);
        return models.question.import(stream)
            .then(result => questionIdMap = result);
    });

    let idMap;

    it('import survey csv into db', () => {
        const stream = intoStream(surveyCsvContent);
        return models.survey.import(stream, questionIdMap)
            .then(result => idMap = result);
    });

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    }

    it('import answer csv into db', () => {
        const userId = hxUser.id(0);
        const stream = intoStream(answerCsvContent);
        return models.answer.importForUser(userId, stream, idMap, questionIdMap);
    });

    it('list imported answers and verify', () => {
        const userId = hxUser.id(0);
        return models.answer.listAnswers({ scope: 'export', userId })
            .then((answers) => {
                const expected = hxAnswer.lastAnswers;
                expected.forEach((record) => {
                    const questionIdInfo = questionIdMap[record.questionId];
                    record.questionId = questionIdInfo.questionId;
                    if (record.questionChoiceId) {
                        const choicesIds = questionIdInfo.choicesIds;
                        record.questionChoiceId = choicesIds[record.questionChoiceId];
                    }
                });
                expect(answers).to.deep.equal(expected);
            });
    });
});
