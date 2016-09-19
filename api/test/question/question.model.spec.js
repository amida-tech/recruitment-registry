/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const helper = require('../helpers');
const models = require('../../models');
const shared = require('../shared.spec.js');

const expect = chai.expect;

const Question = models.Question;

describe('question unit', function () {
    before(shared.setUpFn());

    const examples = [{
        text: 'Which sports do you like?',
        type: 'choices',
        choices: [
            'Football',
            'Basketball',
            'Soccer',
            'Tennis'
        ]
    }, {
        text: 'What is your hair color?',
        type: 'choice',
        choices: [
            'Black',
            'Brown',
            'Blonde',
            'Other'
        ]
    }, {
        text: 'Where were you born?',
        type: 'text'
    }, {
        text: 'Do you have pets?',
        type: 'bool'
    }];

    const cleanServerQuestion = function (question) {
        delete question.id;
        const choices = question.choices;
        if (choices && choices.length) {
            question.choices = _.map(choices, 'text');
        }
    };

    const ids = [];

    const qxBasicFn = function (index) {
        return function () {
            return Question.createQuestion(examples[index])
                .then(id => {
                    ids.push(id);
                    return Question.getQuestion(id);
                })
                .then(actual => {
                    cleanServerQuestion(actual);
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
                    cleanServerQuestion(actual);
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

    const multipleQuestionVerify = function (indices = _.range(examples.length)) {
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
        return Question.getQuestions(ids).then(multipleQuestionVerify());
    });

    it('get all questions', function () {
        return Question.getAllQuestions().then(multipleQuestionVerify());
    });

    it('remove some question and verify', function () {
        return Question.deleteQuestion(ids[1])
            .then(() => Question.deleteQuestion(ids[3]))
            .then(() => Question.getAllQuestions())
            .then(multipleQuestionVerify([0, 2]));
    });
});
