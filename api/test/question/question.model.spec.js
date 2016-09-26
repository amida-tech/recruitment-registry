/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const shared = require('../shared-spec.js');
const qxHelper = require('../helper/question-helper');
const examples = require('../fixtures/question-examples');

const expect = chai.expect;

const Question = models.Question;

describe('question unit', function () {
    before(shared.setUpFn());

    const ids = [];

    const qxBasicFn = function (index) {
        return function () {
            const expected = _.cloneDeep(examples[index]);
            qxHelper.prepareClientQuestion(expected);
            return Question.createQuestion(examples[index])
                .then(id => {
                    ids.push(id);
                    return Question.getQuestion(id);
                })
                .then(actual => {
                    qxHelper.prepareServerQuestion(actual, examples[index]);
                    expect(actual).to.deep.equal(expected);
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
                    qxHelper.prepareServerQuestion(actual, examples[index]);
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

    const questionsVerifyFn = function (indices = _.range(examples.length)) {
        return function (questions) {
            return qxHelper.prepareClientQuestions(examples, ids, indices)
                .then(expected => {
                    expect(questions).to.deep.equal(expected);
                });
        };
    };

    it('get multiple questions', function () {
        return Question.getQuestions(ids).then(questionsVerifyFn());
    });

    it('get all questions', function () {
        return Question.getAllQuestions().then(questionsVerifyFn());
    });

    it('remove some question and verify', function () {
        return Question.deleteQuestion(ids[1])
            .then(() => Question.deleteQuestion(ids[3]))
            .then(() => Question.getAllQuestions())
            .then(questionsVerifyFn([0, 2, 4]));
    });
});
