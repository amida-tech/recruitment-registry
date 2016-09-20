/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const helper = require('../helpers');
const models = require('../../models');
const shared = require('../shared.spec.js');
const qxHelper = require('./question-helper');
const examples = require('../fixtures/question-examples');

const expect = chai.expect;

const Question = models.Question;

describe('question unit', function () {
    before(shared.setUpFn());

    const ids = [];

    const qxBasicFn = function (index) {
        return function () {
            return Question.createQuestion(examples[index])
                .then(id => {
                    ids.push(id);
                    return Question.getQuestion(id);
                })
                .then(actual => {
                    qxHelper.prepareServerQuestion(actual);
                    expect(actual).to.deep.equal(examples[index]);
                })
                .then(() => {
                    const text = `Updated ${examples[index]}`;
                    return Question.updateQuestion(ids[index], { text });
                })
                .then(() => {
                    const id = ids[index];
                    return Question.getQuestion(id);
                })
                .then(actual => {
                    qxHelper.prepareServerQuestion(actual);
                    const expected = _.cloneDeep(examples[index]);
                    expected.text = `Updated ${examples[index]}`;
                    expect(actual).to.deep.equal(expected);
                })
                .then(() => {
                    const text = examples[index].text;
                    return Question.updateQuestion(ids[index], { text });
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`create/get/update question ${i} type ${examples[i].type}`, qxBasicFn(i));
    }

    const multipleQuestionsVerify = function (indices = _.range(examples.length)) {
        return function (questions) {
            const testIds = _.pullAt(ids.slice(), indices);
            const samples = _.pullAt(examples.slice(), indices);
            return helper.buildServerQuestions(samples, testIds)
                .then(expected => {
                    expect(questions).to.deep.equal(expected);
                });
        };
    };

    it('get multiple questions', function () {
        return Question.getQuestions(ids).then(multipleQuestionsVerify());
    });

    it('get all questions', function () {
        return Question.getAllQuestions().then(multipleQuestionsVerify());
    });

    it('remove some question and verify', function () {
        return Question.deleteQuestion(ids[1])
            .then(() => Question.deleteQuestion(ids[3]))
            .then(() => Question.getAllQuestions())
            .then(multipleQuestionsVerify([0, 2]));
    });
});
