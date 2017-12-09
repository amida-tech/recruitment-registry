/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const Generator = require('./util/generator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const SharedSpec = require('./util/shared-spec');
const surveyCommon = require('./util/survey-common');
const questionCommon = require('./util/question-common');

const generator = new Generator();
const shared = new SharedSpec(generator);

describe('survey (patch complete) unit', function surveyPatchUnit() {
    before(shared.setUpFn());

    let surveyCount = 0;

    const hxQuestion = new History();
    const hxSurvey = new SurveyHistory();

    const tests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);
    const questionTests = new questionCommon.SpecTests({ generator, hxQuestion });

    _.range(10).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    _.range(8).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${surveyCount}`, tests.getSurveyFn(surveyCount));
        it('list surveys', tests.listSurveysFn());
        surveyCount += 1;
    });

    _.range(9).forEach((index) => {
        const status = ['draft', 'published', 'retired'][parseInt(index / 3, 10)];
        it(`create survey ${surveyCount}`, tests.createSurveyFn({ status }));
        it(`get survey ${surveyCount}`, tests.getSurveyFn(surveyCount));
        surveyCount += 1;
    });

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 3));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 3));

    it('error: change published survey to draft status',
        tests.errorStatusChangeFn(surveyCount - 4, 'draft', 'surveyPublishedToDraftUpdate', true));

    it('error: retire draft survey',
        tests.errorStatusChangeFn(surveyCount - 7, 'retired', 'surveyDraftToRetiredUpdate', true));

    it('error: patch retired survey',
        tests.errorStatusChangeFn(surveyCount - 2, 'retired', 'surveyRetiredStatusUpdate', true));

    it(`publish draft survey ${surveyCount - 9}`,
        tests.patchSurveyFn(surveyCount - 9, { status: 'published' }, { complete: true }));

    it(`retire published survey ${surveyCount - 6}`,
        tests.patchSurveyFn(surveyCount - 6, { status: 'retired' }, { complete: true }));

    [surveyCount - 6].forEach((index) => {
        it(`verify survey ${index}`, tests.verifySurveyFn(index, { noSectionId: true }));
    });

    [surveyCount - 9, surveyCount - 8, surveyCount - 5].forEach((index) => {
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
    });

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 4));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 2));
});
