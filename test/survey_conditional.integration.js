/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const Answerer = require('./util/generator/answerer');
const RRSuperTest = require('./util/rr-super-test');
const QuestionGenerator = require('./util/generator/question-generator');
const ConditionalSurveyGenerator = require('./util/generator/conditional-survey-generator');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const SharedIntegration = require('./util/shared-integration');
const surveyCommon = require('./util/survey-common');
const choiceSetCommon = require('./util/choice-set-common');

describe('survey (conditional questions) integration', () => {
    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator();
    const surveyGenerator = new ConditionalSurveyGenerator({ questionGenerator, answerer });
    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });

    const surveyCount = surveyGenerator.numOfCases();

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxChoiceSet = new History();
    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    const choiceSets = ConditionalSurveyGenerator.getChoiceSets();
    choiceSets.forEach((choiceSet, index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn(choiceSet));
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });
    it('set comparator choice map', () => {
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(surveyCount).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    _.range(surveyCount).forEach((surveyIndex) => {
        it(`create survey ${surveyIndex + surveyCount} from survey ${surveyIndex} questions`, (done) => {
            const survey = hxSurvey.server(surveyIndex);
            const clientSurvey = hxSurvey.client(surveyIndex);
            const newSurvey = ConditionalSurveyGenerator.newSurveyFromPrevious(clientSurvey, survey);
            rrSuperTest.post('/surveys', newSurvey, 201)
                .expect((res) => {
                    const server = _.cloneDeep(hxSurvey.server(surveyIndex));
                    server.id = res.body.id;
                    hxSurvey.push(newSurvey, server);
                })
                .end(done);
        });
    });

    const verifySurveyFn = function (index) {
        return function verifySurvey(done) {
            const survey = _.cloneDeep(hxSurvey.server(index));
            rrSuperTest.get(`/surveys/${survey.id}`, true, 200)
                .expect((res) => {
                    comparator.conditionalSurveyTwiceCreated(survey, res.body);
                })
                .end(done);
        };
    };

    _.range(surveyCount, 2 * surveyCount).forEach((surveyIndex) => {
        it(`verify survey ${surveyIndex}`, verifySurveyFn(surveyIndex));
    });

    _.range(3).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));

    ConditionalSurveyGenerator.conditionalErrorSetup().forEach((errorSetup) => {
        it(`error: survey ${errorSetup.surveyIndex} validation ${errorSetup.caseIndex}`, (done) => {
            const { surveyIndex, error } = errorSetup;
            const survey = hxSurvey.server(surveyIndex);
            const answers = surveyGenerator.answersWithConditions(survey, errorSetup);
            const input = {
                surveyId: survey.id,
                answers,
            };
            rrSuperTest.post('/answers', input, 400)
                .expect(res => shared.verifyErrorMessage(res, error))
                .end(done);
        });
    });

    it('logout as user 0', shared.logoutFn());

    shared.verifyUserAudit();
});
