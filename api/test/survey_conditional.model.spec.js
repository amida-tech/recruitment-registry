/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');

const models = require('../models');
const Answerer = require('./util/generator/answerer');
const QuestionGenerator = require('./util/generator/question-generator');
const ConditionalSurveyGenerator = require('./util/generator/conditional-survey-generator');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const SurveyHistory = require('./util/survey-history');
const SharedSpec = require('./util/shared-spec');
const surveyCommon = require('./util/survey-common');

const answerer = new Answerer();
const questionGenerator = new QuestionGenerator();
const surveyGenerator = new ConditionalSurveyGenerator(questionGenerator, answerer);
const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
const shared = new SharedSpec(generator);

describe('survey (conditional questions) unit', function () {
    before(shared.setUpFn());

    let surveyCount = 5;

    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.SpecTests(generator, hxSurvey);

    for (let i = 0; i < surveyCount; ++i) {
        it(`create survey ${i}`, tests.createSurveyFn());
        it(`get survey ${i}`, tests.getSurveyFn(i));
    }

    _.range(surveyCount).forEach(surveyIndex => {
        it(`create survey ${surveyIndex + 4} from survey ${surveyIndex} questions`, function () {
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
});
