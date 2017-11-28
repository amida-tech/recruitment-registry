/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const Answerer = require('./util/generator/answerer');
const RRSuperTest = require('./util/rr-super-test');
const QuestionGenerator = require('./util/generator/question-generator');
const CSG = require('./util/generator/conditional-survey-generator');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const SharedIntegration = require('./util/shared-integration');
const surveyCommon = require('./util/survey-common');
const choiceSetCommon = require('./util/choice-set-common');

describe('conditional survey integration', function surveyConditionalIntegration() {
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxChoiceSet = new History();

    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator();
    const surveyGenerator = new CSG({ questionGenerator, answerer, hxSurvey });

    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });

    const numOfCases = surveyGenerator.numOfCases();

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);

    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    const choiceSets = CSG.getChoiceSets();
    choiceSets.forEach((choiceSet, index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn(choiceSet));
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('set comparator choice map', () => {
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(numOfCases).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });
    let surveyCount = numOfCases;

    _.range(numOfCases).forEach((surveyIndex) => {
        if (surveyGenerator.versionWithIdsNeeded(surveyIndex)) {
            it(`create survey ${surveyCount} from survey ${surveyIndex} questions`, () => {
                const survey = hxSurvey.server(surveyIndex);
                const clientSurvey = hxSurvey.client(surveyIndex);
                const newSurvey = CSG.newSurveyFromPrevious(clientSurvey, survey);
                return rrSuperTest.post('/surveys', newSurvey, 201)
                    .then((res) => {
                        const server = _.cloneDeep(hxSurvey.server(surveyIndex));
                        server.id = res.body.id;
                        hxSurvey.push(newSurvey, server);
                    });
            });
            surveyCount += 1;
        }
    });

    const verifySurveyFn = function (index) {
        return function verifySurvey() {
            const survey = _.cloneDeep(hxSurvey.server(index));
            return rrSuperTest.get(`/surveys/${survey.id}`, true, 200)
                .then((res) => {
                    comparator.conditionalSurveyTwiceCreated(survey, res.body);
                });
        };
    };

    _.range(numOfCases, surveyCount).forEach((surveyIndex) => {
        it(`verify survey ${surveyIndex}`, verifySurveyFn(surveyIndex));
    });

    _.range(3).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));

    CSG.conditionalErrorSetup().forEach((errorSetup) => {
        it(`error: survey ${errorSetup.surveyIndex} validation ${errorSetup.caseIndex}`, () => {
            const { surveyIndex, error } = errorSetup;
            const survey = hxSurvey.server(surveyIndex);
            const answers = surveyGenerator.answersWithConditions(survey, errorSetup);
            const input = {
                surveyId: survey.id,
                answers,
            };
            return rrSuperTest.post('/answers', input, 400)
                .then(res => shared.verifyErrorMessage(res, error));
        });
    });

    it('logout as user 0', shared.logoutFn());

    shared.verifyUserAudit();
});
