/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const surveyCommon = require('./util/survey-common');
const assessmentCommon = require('./util/assessment-common');

const generator = new Generator();

const shared = new SharedSpec(generator);

describe('assessment unit', () => {
    const surveyCount = 12;
    const assessmentCount = 3;
    const hxSurvey = new SurveyHistory();
    const hxAssessment = new History(['id', 'name']);

    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);
    const assessmentTests = new assessmentCommon.SpecTests(generator, hxSurvey, hxAssessment);

    before(shared.setUpFn());

    _.range(surveyCount).forEach((index) => {
        it(`create survey ${index}`, surveyTests.createSurveyFn());
        it(`get survey ${index}`, surveyTests.getSurveyFn(index));
    });

    _.range(assessmentCount).forEach((index) => {
        const indices = _.range(index * 4, (index + 1) * 4);
        it(`create assessment ${index}`, assessmentTests.createAssessmentFn(indices));
        it(`get assessment ${index}`, assessmentTests.getAssessmentFn(index));
    });

    it('list assessments', assessmentTests.listAssessmentFn());
});
