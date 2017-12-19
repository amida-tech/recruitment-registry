/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');

const generator = new Generator();
const shared = new SharedSpec(generator);

describe('question patch unit', function questionPatchUnit() {
    before(shared.setUpFn());

    const hxQuestion = new History();
    const hxChoiceSet = new History();
    const tests = new questionCommon.SpecTests({ generator, hxQuestion });
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    _.range(2).forEach((index) => {
        it(`create question ${index} (choice)`, tests.createQuestionFn({ type: 'choice' }));
    });
    _.range(2).forEach((index) => {
        it(`create question ${index} (choices)`, tests.createQuestionFn({ type: 'choices' }));
    });
    _.range(6).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
    });

    _.range(10).forEach((index) => {
        it(`get question ${index}`, tests.getQuestionFn(index));
    });

    [
        { text: 'patch_1', instruction: 'instruction_1' },
        { text: 'patch_2', instruction: null },
        { text: 'patch_3', instruction: 'instruction_2' },
        { meta: { prop: 'prop' } },
        { meta: null },
        { meta: { prop2: 'prop2' } },
        { common: true },
        { common: false },
        { common: null },
    ].forEach((patch, index) => {
        it(`patch question 5 text fields (${index})`, tests.patchQuestionFn(5, patch));
        it(`verify question 5 text fields (${index})`, tests.verifyQuestionFn(5));
    });

    [
        { type: 'text' },
        { multiple: true },
        { choiceSetId: 88 },
        { maxCount: 88 },
    ].forEach((patch, index) => {
        const options = {
            error: 'qxPatchTypeFields',
            errorParam: 'type, multiple, maxCount, choiceSetId',
        };
        it(`error: patch without force (${index}`, tests.errorPatchQuestionFn(0, patch, options));
    });

    _.range(2).forEach((index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(2).map(index => hxChoiceSet.server(index));
        const qxGenerator = generator.questionGenerator;
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(qxGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(2).forEach((index) => {
        it(`create question ${index} (choice set)`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });
});
