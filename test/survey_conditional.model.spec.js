/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const models = require('../models');
const Answerer = require('./util/generator/answerer');
const QuestionGenerator = require('./util/generator/question-generator');
const CSG = require('./util/generator/conditional-survey-generator');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const SharedSpec = require('./util/shared-spec');
const choiceSetCommon = require('./util/choice-set-common');
const surveyCommon = require('./util/survey-common');
const conditionalSession = require('./fixtures/conditional-session/conditional');
const choiceSets = require('./fixtures/example/choice-set');

const expect = chai.expect;

describe('conditional survey unit', function surveyConditionalUnit() {
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
    const shared = new SharedSpec(generator);

    const tests = new surveyCommon.SpecTests(generator, hxSurvey);
    const choiceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    before(shared.setUpFn());

    choiceSets.forEach((choiceSet, index) => {
        it(`create choice set ${index}`, choiceSetTests.createChoiceSetFn(choiceSet));
        it(`get choice set ${index}`, choiceSetTests.getChoiceSetFn(index));
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
                return models.survey.createSurvey(newSurvey)
                    .then((id) => {
                        const updatedSurvey = _.cloneDeep(hxSurvey.server(surveyIndex));
                        updatedSurvey.id = id;
                        hxSurvey.push(newSurvey, updatedSurvey);
                    });
            });
            surveyCount += 1;
        }
    });

    const verifySurveyFn = function (index) {
        return function verifySurvey() {
            const survey = _.cloneDeep(hxSurvey.server(index));
            return models.survey.getSurvey(survey.id)
                .then((serverSurvey) => {
                    comparator.conditionalSurveyTwiceCreated(survey, serverSurvey);
                });
        };
    };

    _.range(numOfCases, surveyCount).forEach((surveyIndex) => {
        it(`verify survey ${surveyIndex}`, verifySurveyFn(surveyIndex));
    });

    _.range(3).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    conditionalSession.errorAnswer.forEach((errorSetup) => {
        it(`error: survey ${errorSetup.surveyIndex} validation ${errorSetup.caseIndex}`, () => {
            const { surveyIndex, error } = errorSetup;
            const survey = hxSurvey.server(surveyIndex);
            const answers = surveyGenerator.answersWithConditions(errorSetup);
            const input = {
                userId: hxUser.id(0),
                surveyId: survey.id,
                answers,
            };
            return models.answer.createAnswers(input)
                .then(shared.throwingHandler, shared.expectedErrorHandler(error));
        });
    });

    conditionalSession.passAnswer.forEach((passSetup) => {
        let answers;

        it(`create survey ${passSetup.surveyIndex} answers ${passSetup.caseIndex}`, () => {
            const survey = hxSurvey.server(passSetup.surveyIndex);
            answers = surveyGenerator.answersWithConditions(passSetup);
            const input = {
                userId: hxUser.id(0),
                surveyId: survey.id,
                answers,
            };
            return models.answer.createAnswers(input);
        });

        it(`verify survey ${passSetup.surveyIndex} answers ${passSetup.caseIndex}`, () => {
            const { surveyIndex } = passSetup;
            const survey = hxSurvey.server(surveyIndex);
            const userId = hxUser.id(0);
            return models.survey.getAnsweredSurvey(userId, survey.id)
                .then((answeredSurvey) => {
                    comparator.answeredSurvey(survey, answers, answeredSurvey);
                });
        });
    });

    const verifyUserSurveyListFn = function (userIndex, statusMap, missingSurveys) {
        return function verifyUserSurveyList() {
            const userId = hxUser.id(userIndex);
            return models.userSurvey.listUserSurveys(userId)
                .then((userSurveys) => {
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
                const userId = hxUser.id(2);
                answers = surveyGenerator.answersWithConditions(userSurveySetup);
                statusMap[surveyIndex] = status;
                const input = {
                    answers,
                    status,
                };
                return models.userSurvey.createUserSurveyAnswers(userId, survey.id, input);
            });
        }

        it(`list user surveys step ${stepIndex}`, verifyUserSurveyListFn(2, statusMap, missingSurveys));
    });
});
