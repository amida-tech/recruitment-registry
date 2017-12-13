/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const Generator = require('./util/generator');
const CSG = require('./util/generator/conditional-survey-generator');
const Answerer = require('./util/generator/answerer');
const QuestionGenerator = require('./util/generator/question-generator');
const PatchGenerator = require('./util/generator/survey-patch-generator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const SharedSpec = require('./util/shared-spec');
const surveyCommon = require('./util/survey-common');
const questionCommon = require('./util/question-common');
const conditionalSession = require('./fixtures/conditional-session/patch');
const models = require('../models');

describe('survey (patch complete) unit', function surveyPatchUnit() {
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();

    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator();
    const surveyGenerator = new CSG({
        questionGenerator,
        answerer,
        hxSurvey,
        setup: conditionalSession.setup,
        requiredOverrides: conditionalSession.requiredOverrides,
    });
    const patchGenerator = new PatchGenerator({ hxSurvey, answerer });

    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
    const tests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);
    const questionTests = new questionCommon.SpecTests({ generator, hxQuestion });

    const shared = new SharedSpec(generator);

    let surveyCount = 0;

    before(shared.setUpFn());

    _.range(10).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    _.range(8).forEach(() => {
        it(`create survey ${surveyCount}`, tests.createSurveyFn());
        it(`get survey ${surveyCount}`, tests.getSurveyFn(surveyCount));
        it(`patch survey ${surveyCount} as is`, tests.patchSameSurveyFn(surveyCount));
        it(`verify survey ${surveyCount}`, tests.verifySurveyFn(surveyCount, { noSectionId: true }));
        it(`patch survey ${surveyCount} same conditions`, tests.patchSameSurveyEnableWhenFn(surveyCount));
        it(`verify survey ${surveyCount}`, tests.verifySurveyFn(surveyCount, { noSectionId: true }));
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

    const p1 = { a: 1 };
    const p2 = { b: 2 };
    const p3 = 1;
    [{ p1, p2 }, { p2 }, null, { p3 }, { p1, p2, p3 }, null].forEach((meta, metaIndex) => {
        [0, 4].forEach((index) => {
            it(`patch meta ${metaIndex} to survey ${index}`,
                tests.patchSurveyFn(index, { meta }, { complete: true }));

            it(`verify survey ${index}`, tests.verifySurveyFn(index, { noSectionId: true }));
        });
    });

    [true, false, false, true].forEach((hasDecription, descriptionIndex) => {
        [0, 4].forEach((index) => {
            const name = `patch name ${descriptionIndex}`;
            const description = hasDecription ? `patch description ${descriptionIndex}` : null;
            it(`patch name/description to survey ${index}`,
                tests.patchSurveyFn(index, { name, description }, { complete: true }));

            it(`verify survey ${index}`, tests.verifySurveyFn(index, { noSectionId: true }));
        });
    });

    const patchSurveyFromSpecFn = function (spec) {
        return function patchSurveyFromSpec() {
            const patch = patchGenerator.generateSurveyPatch(spec);
            const index = spec.surveyIndex;
            const id = hxSurvey.id(index);
            const patchOptions = { complete: true };
            return models.survey.patchSurvey(id, patch, patchOptions);
        };
    };

    const getSurveyFromSpecFn = function (spec) {
        return function getSurveyFromSpec() {
            const surveyId = hxSurvey.id(spec.surveyIndex);
            return models.survey.getSurvey(surveyId)
                .then((survey) => {
                    patchGenerator.compareAndReplace(spec, survey);
                });
        };
    };

    conditionalSession.patchSetup.forEach((spec, index) => {
        it(`patch survey spec ${index}`, patchSurveyFromSpecFn(spec));
        it(`get survey spec ${index}`, getSurveyFromSpecFn(spec));
    });
});
