/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/entity-generator');
const History = require('../util/entity-history');
const questionCommon = require('../util/question-common');
const intoStream = require('into-stream');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('question import-export unit', function () {
    before(shared.setUpFn());

    const hxQuestion = new History();
    const tests = new questionCommon.SpecTests(generator, hxQuestion);

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

    let csvContent;

    it('export questions to csv', function () {
        return models.question.export()
            .then(result => csvContent = result);
    });

    it('reset database', shared.setUpFn());

    let idMap;

    it('import csv into db', function () {
        const stream = intoStream(csvContent);
        return models.question.import(stream)
            .then(result => idMap = result);
    });

    it('list imported questions and verify', function () {
        return models.question.listQuestions({ scope: 'export' })
            .then(list => {
                const fields = questionCommon.getFieldsForList('export');
                const expected = hxQuestion.listServers(fields);
                questionCommon.updateIds(expected, idMap);
                expect(list).to.deep.equal(expected);
            });
    });
});
