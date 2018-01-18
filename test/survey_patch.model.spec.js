/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const CSG = require('./util/generator/conditional-survey-generator');
const Answerer = require('./util/generator/answerer');
const QuestionGenerator = require('./util/generator/question-generator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const SharedSpec = require('./util/shared-spec');
const surveyCommon = require('./util/survey-common');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');
const conditionalSession = require('./fixtures/conditional-session/patch');
const choiceSets = require('./fixtures/example/choice-set');

describe('survey (patch complete) unit', function surveyPatchUnit() {
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const hxChoiceSet = new History();

    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator();
    const surveyGenerator = new CSG({
        questionGenerator,
        answerer,
        hxSurvey,
        setup: conditionalSession.setup,
        requiredOverrides: conditionalSession.requiredOverrides,
    });
    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });

    const tests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);
    const questionTests = new questionCommon.SpecTests({ generator, hxQuestion });
    const choiceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    const shared = new SharedSpec(generator);

    let surveyCount = 0;

    before(shared.setUpFn());

    choiceSets.forEach((choiceSet, index) => {
        it(`create choice set ${index}`, choiceSetTests.createChoiceSetFn(choiceSet));
        it(`get choice set ${index}`, choiceSetTests.getChoiceSetFn(index));
    });

    it('set comparator choice map', () => {
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(10).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    _.range(12).forEach(() => {
        it(`create survey ${surveyCount}`, tests.createSurveyFn());
        it(`get survey ${surveyCount}`, tests.getSurveyFn(surveyCount));
        it(`patch survey ${surveyCount} as is`, tests.patchSameSurveyFn(surveyCount));
        it(`verify survey ${surveyCount}`, tests.verifySurveyFn(surveyCount));
        it(`patch survey ${surveyCount} same conditions`, tests.patchSameSurveyEnableWhenFn(surveyCount));
        it(`verify survey ${surveyCount}`, tests.verifySurveyFn(surveyCount));
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
        tests.errorStatusChangeFn(surveyCount - 4, 'draft', { errorKey: 'surveyPublishedToDraftUpdate' }, true));

    it('error: retire draft survey',
        tests.errorStatusChangeFn(surveyCount - 7, 'retired', { errorKey: 'surveyDraftToRetiredUpdate' }, true));

    it('error: patch retired survey',
        tests.errorStatusChangeFn(surveyCount - 2, 'retired', { errorKey: 'surveyRetiredStatusUpdate' }, true));

    it(`publish draft survey ${surveyCount - 9}`,
        tests.patchSurveyFn(surveyCount - 9, { status: 'published' }, { complete: true }));

    it(`retire published survey ${surveyCount - 6}`,
        tests.patchSurveyFn(surveyCount - 6, { status: 'retired' }, { complete: true }));

    [surveyCount - 6].forEach((index) => {
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
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

            it(`verify survey ${index}`, tests.verifySurveyFn(index));
        });
    });

    [true, false, false, true].forEach((hasDecription, descriptionIndex) => {
        [0, 4].forEach((index) => {
            const name = `patch name ${descriptionIndex}`;
            const description = hasDecription ? `patch description ${descriptionIndex}` : null;
            it(`patch name/description to survey ${index}`,
                tests.patchSurveyFn(index, { name, description }, { complete: true }));

            it(`verify survey ${index}`, tests.verifySurveyFn(index));
        });
    });

    conditionalSession.patchSetup.forEach((spec, index) => {
        it(`patch survey spec ${index}`, tests.patchSurveyFromSpecFn(spec));
        it(`get survey spec ${index}`, tests.getSurveyFromSpecFn(spec));
    });
});
