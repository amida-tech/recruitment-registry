/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const Answerer = require('./util/generator/answerer');
const RRSuperTest = require('./util/rr-super-test');
const QuestionGenerator = require('./util/generator/question-generator');
const ConditionalSurveyGenerator = require('./util/generator/conditional-survey-generator');
const ErroneousConditionalSurveyGenerator = require('./util/generator/erroneous-conditional-survey-generator');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/History');
const SharedIntegration = require('./util/shared-integration');
const surveyCommon = require('./util/survey-common');
const RRError = require('../lib/rr-error');

const expect = chai.expect;

describe('survey (conditional questions) integration', function () {
    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator();
    const errenousSurveyGenerator = new ErroneousConditionalSurveyGenerator();
    const surveyGenerator = new ConditionalSurveyGenerator({ questionGenerator, answerer });
    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
    const shared = new SharedIntegration(generator);

    let surveyCount = 6;

    const rrSuperTest = new RRSuperTest();
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    _.range(errenousSurveyGenerator.numOfCases()).forEach(index => {
        it(`error: create errenous survey ${index}`, function (done) {
            const survey = errenousSurveyGenerator.newSurvey();
            const { code, params, apiOverride } = errenousSurveyGenerator.expectedError(index);
            rrSuperTest.post('/surveys', survey, 400)
                .expect(function (res) {
                    const message = apiOverride || RRError.message(code, ...params);
                    expect(res.body.message).to.equal(message);
                })
                .end(done);
        });
    });

    _.range(surveyCount).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    _.range(surveyCount).forEach(surveyIndex => {
        it(`create survey ${surveyIndex + surveyCount} from survey ${surveyIndex} questions`, function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const clientSurvey = hxSurvey.client(surveyIndex);
            const newSurvey = ConditionalSurveyGenerator.newSurveyFromPrevious(clientSurvey, survey);
            rrSuperTest.post('/surveys', newSurvey, 201)
                .expect(function (res) {
                    const survey = _.cloneDeep(hxSurvey.server(surveyIndex));
                    survey.id = res.body.id;
                    hxSurvey.push(newSurvey, survey);
                })
                .end(done);
        });
    });

    const verifySurveyFn = function (index) {
        return function (done) {
            const survey = _.cloneDeep(hxSurvey.server(index));
            rrSuperTest.get(`/surveys/${survey.id}`, true, 200)
                .expect(function (res) {
                    comparator.conditionalSurveyTwiceCreated(survey, res.body);
                })
                .end(done);
        };
    };

    _.range(surveyCount, 2 * surveyCount).forEach(surveyIndex => {
        it(`verify survey ${surveyIndex}`, verifySurveyFn(surveyIndex));
    });

    _.range(3).forEach(index => {
        it(`create user ${index}`, shared.createUserFn(rrSuperTest, hxUser));
    });

    it('logout as super', shared.logoutFn(rrSuperTest));

    it('login as user 0', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    ConditionalSurveyGenerator.conditionalErrorSetup().forEach(errorSetup => {
        it(`error: survey ${errorSetup.surveyIndex} validation ${errorSetup.caseIndex}`, function (done) {
            const { surveyIndex, error } = errorSetup;
            const survey = hxSurvey.server(surveyIndex);
            const answers = surveyGenerator.answersWithConditions(survey, errorSetup);
            const input = {
                surveyId: survey.id,
                answers
            };
            rrSuperTest.post('/answers', input, 400)
                .expect(function (res) {
                    const message = RRError.message(error);
                    expect(res.body.message).to.equal(message);
                })
                .end(done);
        });
    });

    it('logout as user 0', shared.logoutFn(rrSuperTest));
});
