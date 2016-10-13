/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const answerCommon = require('./util/answer-common');

const expect = chai.expect;

describe('answer integration', function () {
    const generator = new Generator();
    const shared = new SharedIntegration(generator);

    const store = {
        server: null,
        auth: null
    };

    const hxUser = new History();
    const hxQuestion = new History();
    const hxSurvey = new History();
    const hxAnswers = {};

    const generateQxAnswer = _.partial(answerCommon.generateQxAnswer, hxQuestion);

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 4; ++i) {
        const user = generator.newUser();
        it(`create user ${i}`, shared.createUserFn(store, hxUser, user));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, shared.createQxFn(store, hxQuestion));
        it(`fill choices ids in question ${i}`, shared.fillQxFn(store, hxQuestion));
    }

    const testQuestions = answerCommon.testQuestions;

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

    const postAnswersFn = function (userIndex, surveyIndex, seqIndex, stepIndex) {
        return function (done) {
            const qxIndices = testQuestions[surveyIndex].answerSequences[seqIndex][stepIndex];
            const key = `${userIndex}_${surveyIndex}_${seqIndex}`;
            const answers = qxIndices.map(generateQxAnswer);
            answerCommon.updateHxAnswers(hxAnswers, key, qxIndices, answers);
            const input = {
                surveyId: hxSurvey.id(surveyIndex),
                answers
            };
            store.server
                .post('/api/v1.0/answers')
                .set('Authorization', store.auth)
                .send(input)
                .expect(201, done);
        };
    };

    const pullExpectedAnswers = answerCommon.pullExpectedAnswers;

    const getAndVerifyFn = function (userIndex, surveyIndex, seqIndex) {
        return function (done) {
            const key = `${userIndex}_${surveyIndex}_${seqIndex}`;
            const surveyId = hxSurvey.id(surveyIndex);
            store.server
                .get('/api/v1.0/answers')
                .query({ surveyId })
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const preExpected = _.sortBy(pullExpectedAnswers(hxAnswers, key), 'questionId');
                    const expected = answerCommon.prepareClientAnswers(preExpected);
                    const actual = _.sortBy(res.body, 'questionId');
                    expect(actual).to.deep.equal(expected);
                    done();
                });
        };
    };

    for (let j = 0; j < 3; ++j) {
        for (let i = 0; i < cases.length; ++i) {
            const { userIndex, surveyIndex, seqIndex } = cases[i];
            it(`login as user ${userIndex}`, shared.loginIndexFn(store, hxUser, userIndex));

            const msgPost = `answers survey ${surveyIndex}-${seqIndex} step ${j}`;
            it(msgPost, postAnswersFn(userIndex, surveyIndex, seqIndex, j));

            const msgGet = `get and verify answers to survey ${surveyIndex}-${seqIndex} step ${j}`;
            it(msgGet, getAndVerifyFn(userIndex, surveyIndex, seqIndex, j));

            it(`logout as  user ${userIndex}`, shared.logoutFn(store));
        }
    }
});
