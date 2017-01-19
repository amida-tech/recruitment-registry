/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');
const st = require('swagger-tools');

const swaggerJson = require('../swagger.json');
const SPromise = require('../lib/promise');

const models = require('../models');
const Answerer = require('./util/generator/answerer');
const QuestionGenerator = require('./util/generator/question-generator');
const ConditionalSurveyGenerator = require('./util/generator/conditional-survey-generator');
const ErroneousConditionalSurveyGenerator = require('./util/generator/erroneous-conditional-survey-generator');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/History');
const SharedSpec = require('./util/shared-spec');
const surveyCommon = require('./util/survey-common');

const spec = st.specs.v2;

describe('survey (conditional questions) unit', function () {
    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator();
    const errenousSurveyGenerator = new ErroneousConditionalSurveyGenerator();
    const surveyGenerator = new ConditionalSurveyGenerator({ questionGenerator, answerer });
    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
    const shared = new SharedSpec(generator);

    let surveyCount = 6;

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.SpecTests(generator, hxSurvey);

    before(shared.setUpFn());

    _.range(errenousSurveyGenerator.numOfCases()).forEach(index => {
        it(`error: create errenous survey ${index}`, function () {
            const survey = errenousSurveyGenerator.newSurvey();
            const { code, params, apiOverride } = errenousSurveyGenerator.expectedError(index);
            if (apiOverride) {
                return new SPromise(function (resolve, reject) {
                    spec.validateModel(swaggerJson, `#/definitions/newSurvey`, survey, function (err, result) {
                        if (err) {
                            return reject(err);
                        }
                        if (!result) {
                            return reject(new Error('Unexpected no error.'));
                        }
                        resolve();
                    });
                });
            } else {
                return models.survey.createSurvey(survey)
                    .then(shared.throwingHandler, shared.expectedErrorHandler(code, ...params));
            }
        });
    });

    _.range(surveyCount).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    _.range(surveyCount).forEach(surveyIndex => {
        it(`create survey ${surveyIndex + surveyCount} from survey ${surveyIndex} questions`, function () {
            const survey = hxSurvey.server(surveyIndex);
            const clientSurvey = hxSurvey.client(surveyIndex);
            const newSurvey = ConditionalSurveyGenerator.newSurveyFromPrevious(clientSurvey, survey);
            return models.survey.createSurvey(newSurvey)
                .then(id => {
                    const survey = _.cloneDeep(hxSurvey.server(surveyIndex));
                    survey.id = id;
                    hxSurvey.push(newSurvey, survey);
                });
        });
    });

    const verifySurveyFn = function (index) {
        return function () {
            const survey = _.cloneDeep(hxSurvey.server(index));
            return models.survey.getSurvey(survey.id)
                .then(serverSurvey => {
                    comparator.conditionalSurveyTwiceCreated(survey, serverSurvey);
                });
        };
    };

    _.range(surveyCount, 2 * surveyCount).forEach(surveyIndex => {
        it(`verify survey ${surveyIndex}`, verifySurveyFn(surveyIndex));
    });

    _.range(3).forEach(index => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    ConditionalSurveyGenerator.conditionalErrorSetup().forEach(errorSetup => {
        it(`error: survey ${errorSetup.surveyIndex} validation ${errorSetup.caseIndex}`, function () {
            const { surveyIndex, error } = errorSetup;
            const survey = hxSurvey.server(surveyIndex);
            const answers = surveyGenerator.answersWithConditions(survey, errorSetup);
            const input = {
                userId: hxUser.id(0),
                surveyId: survey.id,
                answers
            };
            return models.answer.createAnswers(input)
                .then(shared.throwingHandler, shared.expectedErrorHandler(error));
        });
    });

});
