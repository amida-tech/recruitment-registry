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
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const assessmentAnswerCommon = require('./util/assessment-answer-common');
const questionCommon = require('./util/question-common');
const surveyCommon = require('./util/survey-common');
const assessmentCommon = require('./util/assessment-common');

const answerSession = require('./fixtures/answer-session/assessment-0');

const expect = chai.expect;

const findMax = function findMax(property) {
    return 1 + answerSession.reduce((r, q) => {
        r = Math.max(r, q[property]);
        return r;
    }, 0);
};

describe('assessment answer integration', function answerAssessmentIntegration() {
    const generator = new Generator();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxAssessment = new History();

    const questionTests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxQuestion);
    const assessmentTests = new assessmentCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxAssessment);
    const tests = new assessmentAnswerCommon.IntegrationTests(rrSuperTest, {
        generator, hxUser, hxSurvey, hxQuestion, hxAssessment,
    });

    const userCount = findMax('user');
    const questionCount = answerSession.reduce((r, { questions }) => {
        questions.forEach((question) => {
            r = Math.max(r, question + 1);
        });
        return r;
    }, 0);
    const nameCount = findMax('name');
    const stageCount = findMax('stage');

    before(shared.setUpFn());

    it('sanity checks', function sanityChecks() {
        expect(userCount).to.be.above(0);
        expect(questionCount).to.be.above(0);
        expect(nameCount).to.be.above(0);
        expect(stageCount).to.be.above(0);
    });

    it('login as super', shared.loginFn(config.superUser));

    _.range(4).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    _.range(userCount).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(questionCount).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    const surveyOpts = { noneRequired: true };
    it('create survey 0', surveyTests.createSurveyQxHxFn(_.range(questionCount), surveyOpts));

    _.range(nameCount).forEach((nameIndex) => {
        _.range(stageCount).forEach((stage) => {
            const name = `name_${nameIndex}`;
            const override = { name, stage };
            it(`create assessment ${name} ${stage}`, assessmentTests.createAssessmentFn([0], override));
        });
    });

    it('logout as super', shared.logoutFn());

    const assessmentIndexSet = new Set();
    answerSession.forEach((answersSpec) => {
        const { name, stage, user, questions } = answersSpec;
        const userIndex = user;
        const questionIndices = questions;
        const assessmentIndex = (name * stageCount) + stage;
        it(`login as user ${userIndex}`, shared.loginIndexFn(hxUser, userIndex));
        if (!assessmentIndexSet.has(assessmentIndex)) {
            assessmentIndexSet.add(assessmentIndex);
            if (stage > 0) {
                const prevAssessmentIndex = (name * stageCount) + (stage - 1);
                it(`user ${userIndex} copies assessesment ${name} ${stage}`, tests.copyAssessmentAnswersFn(userIndex, 0, assessmentIndex, prevAssessmentIndex));
            }
        }
        it(`user ${userIndex} creates assessesment ${name} ${stage}`, tests.createAssessmentAnswersFn(userIndex, 0, questionIndices, assessmentIndex));
        it(`user ${userIndex} gets answers  assessesment ${name} ${stage}`, tests.getAssessmentAnswersFn(userIndex, 0, assessmentIndex));
        it(`logout as  user ${userIndex}`, shared.logoutFn());
    });
});
