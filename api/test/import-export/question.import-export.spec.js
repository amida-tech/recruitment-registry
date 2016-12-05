/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');

const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/entity-generator');
const History = require('../util/entity-history');
const questionCommon = require('../util/question-common');

const generator = new Generator();
const shared = new SharedSpec(generator);

describe('question import-export unit', function () {
    before(shared.setUpFn());

    const hxQuestion = new History();
    const tests = new questionCommon.specTests(generator, hxQuestion);
    let csvContent;

    for (let i = 0; i < 12; ++i) {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
    }

    it('list all questions', tests.listQuestionsFn('export'));

    _.forEach([1, 6, 10], index => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('list all questions (export)', tests.listQuestionsFn('export'));

    for (let i = 12; i < 24; ++i) {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
    }

    _.forEach([4, 17], index => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('list all questions (export)', tests.listQuestionsFn('export'));

    it('export questions to csv', function () {
        return models.question.export()
            .then(result => csvContent = result);
    });
});
