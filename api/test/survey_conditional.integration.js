/* global describe,before,it*/
'use strict';
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
const SharedIntegration = require('./util/shared-integration');
const surveyCommon = require('./util/survey-common');

const answerer = new Answerer();
const questionGenerator = new QuestionGenerator();
const surveyGenerator = new ConditionalSurveyGenerator(questionGenerator, answerer);
const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
const shared = new SharedIntegration(generator);

describe('survey (conditional questions) integration', function () {
    let surveyCount = 5;

    const rrSuperTest = new RRSuperTest();
    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    for (let i = 0; i < surveyCount; ++i) {
        it(`create survey ${i}`, tests.createSurveyFn());
        it(`get survey ${i}`, tests.getSurveyFn(i));
    }

    _.range(surveyCount).forEach(surveyIndex => {
        it(`create survey ${surveyIndex + 4} from survey ${surveyIndex} questions`, function (done) {
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

    it('logout as super', shared.logoutFn(rrSuperTest));
});
