/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const Answerer = require('../util/generator/answerer');
const QuestionGenerator = require('../util/generator/question-generator');
const ConditionalSurveyGenerator = require('../util/generator/conditional-survey-generator');
const Generator = require('../util/generator');
const comparator = require('../util/comparator');
const SharedSpec = require('../util/shared-spec.js');
const SurveyHistory = require('../util/survey-history');
const History = require('../util/history');
const choiceSetCommon = require('../util/choice-set-common');
const surveyCommon = require('../util/survey-common');
const intoStream = require('into-stream');
const conditionalSession = require('../fixtures/conditional-session/conditional');
const choiceSets = require('../fixtures/example/choice-set');

const expect = chai.expect;

describe('survey import-export conditional unit', function surveyImportExportUnit() {
    const hxSurvey = new SurveyHistory();
    const hxChoiceSet = new History();
    const counts = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];

    const answerer = new Answerer();
    const questionGenerator = new QuestionGenerator(null, { noMeta: true });
    const surveyGenerator = new ConditionalSurveyGenerator({
        questionGenerator,
        hxSurvey,
        setup: conditionalSession.setup,
        requiredOverrides: conditionalSession.requiredOverrides,
        counts,
    });
    const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
    const shared = new SharedSpec(generator);

    const surveyCount = counts.length;

    const tests = new surveyCommon.SpecTests(generator, hxSurvey);
    const choiceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    before(shared.setUpFn());

    choiceSets.forEach((choiceSet, index) => {
        it(`create choice set ${index}`, choiceSetTests.createChoiceSetFn(choiceSet));
        it(`get choice set ${index}`, choiceSetTests.getChoiceSetFn(index));
    });

    it('set comparator choice map', () => {
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(surveyCount).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn({ noSection: true }));
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    it('list all surveys (export)', tests.listSurveysFn({ scope: 'export' }));

    let questionCsvContent;
    let sectionCsvContent;
    let surveyCsvContent;
    let rulesCsvConsent;

    it('export questions to csv', function exportQuestionsToCSV() {
        return models.question.exportQuestions()
            .then((result) => { questionCsvContent = result; });
    });

    it('export sections to csv', function exportSectionsToCSV() {
        return models.section.exportSections()
            .then((result) => { sectionCsvContent = result; });
    });

    it('export surveys to csv', function exportSurveysToCSV() {
        return models.survey.exportSurveys()
            .then((result) => { surveyCsvContent = result; });
    });

    it('export rules to csv', function exportRulesToCSV() {
        return models.answerRule.exportAnswerRules()
            .then((result) => { rulesCsvConsent = result; });
    });

    it('reset database', shared.setUpFn());

    let questionIdMap;

    it('import question csv into db', function importQuestionsFromCSV() {
        const stream = intoStream(questionCsvContent);
        return models.question.importQuestions(stream)
            .then((result) => { questionIdMap = result; });
    });

    let sectionIdMap;

    it('import section csv into db', function importSectionsFromCSV() {
        const stream = intoStream(sectionCsvContent);
        return models.section.importSections(stream, { meta: ['someBool', 'someOtherBool'] })
            .then((result) => { sectionIdMap = result; });
    });

    let idMap;

    it('import survey csv into db', function importSurveysFromCSV() {
        const stream = intoStream(surveyCsvContent);
        return models.survey.importSurveys(stream, { questionIdMap, sectionIdMap })
            .then((result) => { idMap = result; });
    });

    let ruleIdMap;

    it('import rules csv into db', function importRulesFromCSV() {
        const stream = intoStream(rulesCsvConsent);
        return models.answerRule.importAnswerRules(stream, { questionIdMap, sectionIdMap, surveyIdMap: idMap })
            .then((result) => { ruleIdMap = result; });
    });

    it('list imported surveys and verify', function listImportedAndVerify() {
        return models.survey.listSurveys({ scope: 'export' })
            .then((list) => {
                let expected = hxSurvey.listServersByScope({ scope: 'export' });
                expected = _.cloneDeep(expected);
                surveyCommon.updateIds(expected, idMap, questionIdMap, sectionIdMap, ruleIdMap);
                expect(list.length).to.equal(expected.length);
                list.forEach((actual, index) => {
                    expect(actual).to.deep.equal(expected[index]);
                });
            });
    });

    // const verifySurveyFn = function (index) {
    //    return function verifySurvey() {
    //        const survey = hxSurvey.server(index);
    //        const id = parseInt(idMap[survey.id], 10);
    //        return models.survey.getSurvey(id)
    //           .then((actual) => {
    //               surveyCommon.updateIds([survey], idMap, questionIdMap, sectionIdMap, ruleIdMap);
    //               delete survey.meta;
    //               expect(actual).to.deep.equal(survey);
    //           });
    //    };
    // };

    // _.range(surveyCount).forEach((index) => {
    //    it(`verify survey ${index}`, verifySurveyFn(index));
    // });
});
