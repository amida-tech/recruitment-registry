/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const RRSuperTest = require('./util/rr-super-test');
const SharedIntegration = require('./util/shared-integration');
const Generator = require('./util/generator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const surveyCommon = require('./util/survey-common');
const assessmentCommon = require('./util/assessment-common');

const generator = new Generator();

const shared = new SharedIntegration(generator);

describe('assessment integration', function () {
    const surveyCount = 12;
    const assessmentCount = 3;
    const hxSurvey = new SurveyHistory();
    const hxAssessment = new History(['id', 'name']);

    const rrSuperTest = new RRSuperTest();
    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const assessmentTests = new assessmentCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxAssessment);

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    _.range(surveyCount).forEach(index => {
        it(`create survey ${index}`, surveyTests.createSurveyFn());
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    _.range(assessmentCount).forEach(index => {
        const indices = _.range(index * 4, (index + 1) * 4);
        it(`create assessment ${index}`, assessmentTests.createAssessmentFn(indices));
        it(`get assessment ${index}`, assessmentTests.getAssessmentFn(index));
    });

    it('list assessments', assessmentTests.listAssessmentFn());

    it('logout as super', shared.logoutFn(rrSuperTest));
});
