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
    }];

    const cleanServerQuestion = function (question) {
        delete question.id;
        const choices = question.choices;
        if (choices && choices.length) {
            question.choices = _.map(choices, 'text');
        }
    };

    const ids = [];

    it('create/get multiple choice question with multiple answers (checkboxes)', function () {
        return Question.createQuestion(examples[0])
            .then(id => {
                ids.push(id);
                return Question.getQuestion(id);
            })
            .then(actual => {
                cleanServerQuestion(actual);
                expect(actual).to.deep.equal(examples[0]);
            });
    });

    it('create/get multiple choice question with single answer (drop down)', function () {
        return Question.createQuestion(examples[1])
            .then(id => {
                ids.push(id);
                return Question.getQuestion(id);
            })
            .then(actual => {
                cleanServerQuestion(actual);
                expect(actual).to.deep.equal(examples[1]);
            });
    });

    it('create/get text question', function () {
        return Question.createQuestion(examples[2])
            .then(id => {
                ids.push(id);
                return Question.getQuestion(id);
            })
            .then(actual => {
                cleanServerQuestion(actual);
                expect(actual).to.deep.equal(examples[2]);
            });
    });

    it('get multiple questions', function () {
        return Question.getQuestions(ids)
            .then(questions => {
                return helper.buildServerQuestions(examples, ids)
                    .then(expected => {
                        expect(questions).to.deep.equal(expected);
                    });
            });
    });
});
