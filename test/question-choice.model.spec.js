/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const surveyCommon = require('./util/survey-common');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');

const generator = new Generator();
const shared = new SharedSpec(generator);

describe('question choice unit', () => {
    before(shared.setUpFn());

    const hxQuestion = new History();
    const hxChoiceSet = new History();
    const hxSurvey = new History();
    const questionTests = new questionCommon.SpecTests(generator, hxQuestion);
    const choiceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);

    _.range(10).forEach((i) => {
        it(`create question ${i}`, questionTests.createQuestionFn());
        it(`get question ${i}`, questionTests.getQuestionFn(i));
    });

    [
        [0, 1, 2],
        [3, 4, 5],
    ].forEach((questionIndices, index) => {
        const title = `create survey ${index} from questions ${questionIndices}`;
        it(title, surveyTests.createSurveyQxHxFn(questionIndices));
    });

    _.range(8).forEach((index) => {
        it(`create choice set ${index}`, choiceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choiceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(8).map(index => hxChoiceSet.server(index));
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(generator.questionGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(10, 20).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });
});
