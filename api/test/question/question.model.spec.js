/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const helper = require('../helpers');
const models = require('../../models');

var expect = chai.expect;

var QuestionType = models.QuestionType;
var QuestionChoices = models.QuestionChoices;
var Question = models.Question;

describe('question unit', function () {
    before(function () {
        return QuestionType.sync({
            force: true
        }).then(function () {
            return QuestionChoices.sync({
                force: true
            });
        }).then(function () {
            return Question.sync({
                force: true
            });
        });
    });

    const examples = [{
        text: 'Which sports do you like?',
        type: 'multi-choice-multi',
        choices: [
            'Football',
            'Basketball',
            'Soccer',
            'Tennis'
        ]
    }, {
        text: 'What is your hair color?',
        type: 'multi-choice-single',
        choices: [
            'Black',
            'Brown',
            'Blonde',
            'Other'
        ]
    }, {
        text: 'Where were you born?',
        type: 'text'
    }];

    const cleanServerQuestion = function (question) {
        delete question.id;
        const choices = question.choices;
        if (choices && choices.length) {
            question.choices = _.map(choices, 'text');
        }
    };

    const ids = [];

    it('post/get multiple choice question with multiple answers (checkboxes)', function () {
        return Question.post(examples[0]).then(function (id) {
            ids.push(id);
            return Question.get(id);
        }).then(function (actual) {
            cleanServerQuestion(actual);
            expect(actual).to.deep.equal(examples[0]);
        });
    });

    it('post/get multiple choice question with single answer (drop down)', function () {
        return Question.post(examples[1]).then(function (id) {
            ids.push(id);
            return Question.get(id);
        }).then(function (actual) {
            cleanServerQuestion(actual);
            expect(actual).to.deep.equal(examples[1]);
        });
    });

    it('post/get text question', function () {
        return Question.post(examples[2]).then(function (id) {
            ids.push(id);
            return Question.get(id);
        }).then(function (actual) {
            cleanServerQuestion(actual);
            expect(actual).to.deep.equal(examples[2]);
        });
    });

    it('get multiple questions', function () {
        return Question.getMultiple(ids).then(function (questions) {
            return helper.buildServerQuestions(examples, ids).then(function (expected) {
                expect(questions).to.deep.equal(expected);
            });
        });
    });
});
