'use strict';

const chai = require('chai');

const models = require('../../models');
const comparator = require('./client-server-comparator');

const scopeToFieldsMap = {
    'summary': ['id', 'type', 'text', 'instruction'],
    'complete': null,
    'export': ['id', 'type', 'text', 'instruction', 'choices']
};

const expect = chai.expect;

const getFieldsForList = function (scope) {
    scope = scope || 'summary';
    return scopeToFieldsMap[scope];
};

const specTests = class QuestionSpecTests {
    constructor(generator, hxQuestion) {
        this.generator = generator;
        this.hxQuestion = hxQuestion;
    }

    createQuestionFn() {
        const generator = this.generator;
        const hxQuestion = this.hxQuestion;
        return function () {
            const qx = generator.newQuestion();
            return models.question.createQuestion(qx)
                .then(id => hxQuestion.push(qx, { id }));
        };
    }

    getQuestionFn(index) {
        const hxQuestion = this.hxQuestion;
        return function () {
            const id = hxQuestion.id(index);
            return models.question.getQuestion(id)
                .then(question => {
                    hxQuestion.updateServer(index, question);
                    return comparator.question(hxQuestion.client(index), question);
                });
        };
    }

    deleteQuestionFn(index) {
        const hxQuestion = this.hxQuestion;
        return function () {
            return models.question.deleteQuestion(hxQuestion.id(index))
                .then(() => {
                    hxQuestion.remove(index);
                });
        };
    }

    listQuestionsFn(scope) {
        const hxQuestion = this.hxQuestion;
        return function () {
            const options = scope ? {} : undefined;
            if (scope) {
                options.scope = scope;
            }
            return models.question.listQuestions(options)
                .then(questions => {
                    const fields = getFieldsForList(scope);
                    const expected = hxQuestion.listServers(fields);
                    expect(questions).to.deep.equal(expected);
                });
        };
    }
};

module.exports = {
    getFieldsForList,
    specTests
};
