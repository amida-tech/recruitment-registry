/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

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
const conditionalSession = require('./fixtures/conditional-session/conditional');
const choiceSets = require('./fixtures/example/choice-set');

const expect = chai.expect;

describe('conditional survey integration', function surveyConditionalIntegration() {
    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxChoiceSet = new History();
    const numOfCases = Math.max(...conditionalSession.setup.map(r => r.surveyIndex)) + 1;
    const counts = _.range(numOfCases).map(() => 8);

    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator();
    const surveyGenerator = new CSG({
        questionGenerator,
        answerer,
        hxSurvey,
        setup: conditionalSession.setup,
        requiredOverrides: conditionalSession.requiredOverrides,
        counts,
    });
    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    choiceSets.forEach((choiceSet, index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn(choiceSet));
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('set comparator choice map', () => {
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(numOfCases).forEach((index) => {
        if (surveyGenerator.createStubbingNeeded(index)) {
            it(`do necessary stubbing for survey ${index}`, surveyGenerator.createStubFn(index));
        }
        it(`create survey ${index}`, tests.createSurveyFn({ noSection: true }));
        if (surveyGenerator.createStubbingNeeded(index)) {
            it(`remove stubbing/updates for survey ${index}`, surveyGenerator.createUnstubFn(hxSurvey, index));
        }
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

    conditionalSession.errorAnswer.forEach((errorSetup) => {
        it(`error: survey ${errorSetup.surveyIndex} validation ${errorSetup.caseIndex}`, () => {
            const { surveyIndex, error } = errorSetup;
            const survey = hxSurvey.server(surveyIndex);
            const answers = surveyGenerator.answersWithConditions(errorSetup);
            const input = {
                surveyId: survey.id,
                answers,
            };
            return rrSuperTest.post('/answers', input, 400)
                .then(res => shared.verifyErrorMessage(res, error));
        });
    });

    conditionalSession.passAnswer.forEach((passSetup) => {
        let answers;

        it(`create survey ${passSetup.surveyIndex} answers ${passSetup.caseIndex}`, () => {
            const survey = hxSurvey.server(passSetup.surveyIndex);
            answers = surveyGenerator.answersWithConditions(passSetup);
            const input = {
                surveyId: survey.id,
                answers,
            };
            return rrSuperTest.post('/answers', input, 204);
        });

        it(`verify survey ${passSetup.surveyIndex} answers ${passSetup.caseIndex}`, () => {
            const { surveyIndex } = passSetup;
            const survey = hxSurvey.server(surveyIndex);
            return rrSuperTest.get(`/answered-surveys/${survey.id}`, true, 200)
                .then((res) => {
                    if (rrSuperTest.userRole !== 'admin') {
                        delete survey.authorId;
                    }
                    comparator.answeredSurvey(survey, answers, res.body);
                });
        });
    });

    it('logout as user 0', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));

    const verifyUserSurveyListFn = function (userIndex, statusMap, missingSurveys) {
        return function verifyUserSurveyList() {
            return rrSuperTest.get('/user-surveys', true, 200)
                .then((res) => {
                    const userSurveys = res.body;
                    const expectedAll = _.cloneDeep(hxSurvey.listServers());
                    expectedAll.forEach((r, index) => {
                        r.status = statusMap[index] || 'new';
                        delete r.type;
                        if (r.description === undefined) {
                            delete r.description;
                        }
                    });
                    const missingSet = new Set(missingSurveys);
                    const expected = expectedAll.filter((r, index) => !missingSet.has(index));
                    expect(userSurveys).to.deep.equal(expected);
                });
        };
    };

    const statusMap = {};
    conditionalSession.userSurveys.forEach((userSurveySetup, stepIndex) => {
        const { skipAnswering, surveyIndex, missingSurveys, status } = userSurveySetup;
        if (!skipAnswering) {
            let answers;

            it(`answer survey ${surveyIndex} step ${stepIndex}`, () => {
                const survey = hxSurvey.server(surveyIndex);
                answers = surveyGenerator.answersWithConditions(userSurveySetup);
                statusMap[surveyIndex] = status;
                const input = {
                    answers,
                    status,
                };
                return rrSuperTest.post(`/user-surveys/${survey.id}/answers`, input, 204);
            });
        }

        it(`list user surveys step ${stepIndex}`, verifyUserSurveyListFn(2, statusMap, missingSurveys));
    });

    it('logout as user 2', shared.logoutFn());

    shared.verifyUserAudit();
});
