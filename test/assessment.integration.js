/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

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

describe('assessment integration', function assessmentIntegration() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);

    const hxSurvey = new SurveyHistory();
    const hxAssessment = new History(['id', 'name', 'stage', 'group']);

    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const tests = new assessmentCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxAssessment);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    const surveyCount = 15;
    _.range(surveyCount).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn());
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    let count = 0;
    _.range(3).forEach((index) => {
        const surveyIndices = _.range(index * 4, (index + 1) * 4);
        const override = (index > 1 ? {} : { group: 'group_0' });
        const assmentIndex = index + count;
        it(`create assessment ${assmentIndex}`, tests.createAssessmentFn(surveyIndices, override));
        it(`get assessment ${assmentIndex}`, tests.getAssessmentFn(assmentIndex));
    });
    count += 3;

    _.range(3).forEach((index) => {
        const surveyIndices = [12 + index];
        const assmentIndex = index + count;
        const override = (index < 1 ? {} : { group: 'group_1' });
        it(`create assessment ${assmentIndex}`, tests.createAssessmentFn(surveyIndices, override));
        it(`get assessment ${assmentIndex}`, tests.getAssessmentFn(assmentIndex));
    });
    count += 3;

    it('list assessments', tests.listAssessmentFn());

    it('list assessment nonexistent group', tests.listAssessmentGroupFn('group_x', []));

    it('list assessment group 1', tests.listAssessmentGroupFn('group_0', [0, 1]));

    it('list assessment group 2', tests.listAssessmentGroupFn('group_1', [4, 5]));

    [2, 5].forEach((index) => {
        it(`delete assessment ${index}`, tests.deleteAssessmentFn(index));
    });

    it('list assessments', tests.listAssessmentFn());

    it('list assessments', tests.listAssessmentFn());

    it('list assessment group 1', tests.listAssessmentGroupFn('group_0', [0, 1]));

    it('list assessment group 2', tests.listAssessmentGroupFn('group_1', [3]));

    it('logout as super', shared.logoutFn());

    shared.verifyUserAudit();
});
