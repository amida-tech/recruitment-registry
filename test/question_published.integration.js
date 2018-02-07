/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const surveyCommon = require('./util/survey-common');
const questionCommon = require('./util/question-common');

describe('question published integration', () => {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);

    const hxQuestion = new History();
    const hxSurvey = new SurveyHistory();

    const surveyTests = new surveyCommon.IntegrationTests(
        rrSuperTest, generator, hxSurvey, hxQuestion);
    const tests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });

    const listQuestions = (indices) => {
        it('list all questions (complete)', tests.listQuestionsFn('complete'));

        it('list all questions (summary)', tests.listQuestionsFn('summary'));

        it('list published questions (complete)', tests.listQuestionsFn({
            indices,
            scope: 'complete',
            surveyPublished: true,
        }));

        it('list published questions (summary)', tests.listQuestionsFn({
            indices,
            scope: 'summary',
            surveyPublished: true,
        }));
    };

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    listQuestions([]);

    _.range(20).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });

    listQuestions([]);

    it('create published survey 0 from questions 0, 2, 4, 6, 8',
        surveyTests.createSurveyQxHxFn([0, 2, 4, 6, 8], { status: 'published' }));

    listQuestions([0, 2, 4, 6, 8]);

    it('create draft survey 1 from questions 10, 12, 14, 16, 18',
        surveyTests.createSurveyQxHxFn([10, 12, 14, 16, 18], { status: 'draft' }));

    listQuestions([0, 2, 4, 6, 8]);

    it('create draft survey 2 from questions 11, 13, 15, 17, 19',
        surveyTests.createSurveyQxHxFn([11, 13, 15, 17, 19], { status: 'draft' }));

    listQuestions([0, 2, 4, 6, 8]);

    it('patch survey 2 to status published',
        surveyTests.patchSurveyFn(2, { status: 'published' }));

    listQuestions([0, 2, 4, 6, 8, 11, 13, 15, 17, 19]);

    it('create published survey 3 from questions 1, 3, 5, 7, 9',
        surveyTests.createSurveyQxHxFn([1, 3, 5, 7, 9]));

    listQuestions([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 15, 17, 19]);

    it('patch survey 2 to status retired',
        surveyTests.patchSurveyFn(2, { status: 'retired' }));

    listQuestions([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    it('patch survey 1 to status published',
        surveyTests.patchSurveyFn(1, { status: 'published' }));

    listQuestions([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18]);

    it('delete survey 0', surveyTests.deleteSurveyFn(0));

    listQuestions([1, 3, 5, 7, 9, 10, 12, 14, 16, 18]);

    it('logout as user', shared.logoutFn());
});
