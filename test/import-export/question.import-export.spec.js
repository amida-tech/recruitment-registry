/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const SharedSpec = require('../util/shared-spec.js');
const Generator = require('../util/generator');
const History = require('../util/history');
const questionCommon = require('../util/question-common');
const intoStream = require('into-stream');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('question import-export unit', () => {
    before(shared.setUpFn());

    const hxQuestion = new History();
    const tests = new questionCommon.SpecTests({ generator, hxQuestion });

    _.range(12).forEach((i) => {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
    });

    it('list all questions', tests.listQuestionsFn('export'));

    _.forEach([1, 6, 10], (index) => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('list all questions (export)', tests.listQuestionsFn('export'));

    _.range(12, 24).forEach((i) => {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
    });

    _.forEach([4, 17], (index) => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('list all questions (export)', tests.listQuestionsFn('export'));

    let csvContent;

    it('export questions to csv', () => models.question.exportQuestions()
            .then((result) => { csvContent = result; }));

    it('reset database', shared.setUpFn());

    let idMap;

    it('import csv into db', () => {
        const stream = intoStream(csvContent);
        return models.question.importQuestions(stream)
            .then((result) => { idMap = result; });
    });

    it('list imported questions and verify', () => models.question.listQuestions({ scope: 'export' })
            .then((list) => {
                const fields = questionCommon.getFieldsForList('export');
                const expected = _.cloneDeep(hxQuestion.listServers(fields));
                expected.forEach((question) => {
                    delete question.meta;
                    if (question.choices) {
                        question.choices.forEach(choice => delete choice.meta);
                    }
                });
                questionCommon.updateIds(expected, idMap);
                expect(list).to.deep.equal(expected);
            }));
});
