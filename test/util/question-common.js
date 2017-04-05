'use strict';

const chai = require('chai');

const models = require('../../models');
const comparator = require('./comparator');

const scopeToFieldsMap = {
    summary: ['id', 'type', 'text', 'instruction'],
    complete: null,
    export: ['id', 'type', 'text', 'instruction', 'choices', 'meta'],
};

const expect = chai.expect;

const getFieldsForList = function (scope) {
    scope = scope || 'summary';
    return scopeToFieldsMap[scope];
};

const updateIds = function (questions, idMap) {
    questions.forEach((question) => {
        const questionIdMap = idMap[question.id];
        if (!questionIdMap) {
            throw new Error(`updateIds: id for '${question.text}' does not exist in the map`);
        }
        question.id = questionIdMap.questionId;
        const choices = question.choices;
        if (choices) {
            const choiceIdMap = questionIdMap.choicesIds;
            if (!choiceIdMap) {
                throw new Error(`updateIds: choice id map does not exist for '${question.text}'`);
            }
            choices.forEach((choice) => {
                const choiceId = choiceIdMap[choice.id];
                if (!choiceId) {
                    throw new Error(`updateIds: choice id does not exist for for '${choice.text}' in '${question.id}'`);
                }
                choice.id = choiceId;
            });
        }
    });
};

const SpecTests = class QuestionSpecTests {
    constructor(generator, hxQuestion, inputModels) {
        this.generator = generator;
        this.hxQuestion = hxQuestion;
        this.models = inputModels || models;
    }

    createQuestionFn(question) {
        const generator = this.generator;
        const hxQuestion = this.hxQuestion;
        const m = this.models;
        return function createQuestion() {
            question = question || generator.newQuestion();
            return m.question.createQuestion(question)
                .then(({ id }) => hxQuestion.push(question, { id }));
        };
    }

    getQuestionFn(index) {
        const hxQuestion = this.hxQuestion;
        const m = this.models;
        return function getQuestion() {
            index = (index === undefined) ? hxQuestion.lastIndex() : index;
            const id = hxQuestion.id(index);
            return m.question.getQuestion(id)
                .then((question) => {
                    hxQuestion.updateServer(index, question);
                    comparator.question(hxQuestion.client(index), question);
                });
        };
    }

    verifyQuestionFn(index) {
        const hxQuestion = this.hxQuestion;
        return function verifyQuestion() {
            const question = hxQuestion.server(index);
            return models.question.getQuestion(question.id)
                .then((result) => {
                    expect(result).to.deep.equal(question);
                });
        };
    }

    deleteQuestionFn(index) {
        const hxQuestion = this.hxQuestion;
        const m = this.models;
        return function deleteQuestion() {
            return m.question.deleteQuestion(hxQuestion.id(index))
                .then(() => {
                    hxQuestion.remove(index);
                });
        };
    }

    listQuestionsFn(scope) {
        const hxQuestion = this.hxQuestion;
        const m = this.models;
        return function listQuestions() {
            const options = scope ? {} : undefined;
            if (scope) {
                options.scope = scope;
            }
            return m.question.listQuestions(options)
                .then((questions) => {
                    const fields = getFieldsForList(scope);
                    const expected = hxQuestion.listServers(fields);
                    expect(questions).to.deep.equal(expected);
                });
        };
    }
};

const IntegrationTests = class QuestionIntegrationTests {
    constructor(rrSuperTest, generator, hxQuestion) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxQuestion = hxQuestion;
    }

    createQuestionFn(question) {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxQuestion = this.hxQuestion;
        return function createQuestion(done) {
            question = question || generator.newQuestion();
            rrSuperTest.post('/questions', question, 201)
                .expect((res) => {
                    hxQuestion.push(question, res.body);
                })
                .end(done);
        };
    }

    getQuestionFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxQuestion = this.hxQuestion;
        return function getQuestion(done) {
            index = (index === undefined) ? hxQuestion.lastIndex() : index;
            const id = hxQuestion.id(index);
            rrSuperTest.get(`/questions/${id}`, true, 200)
                .expect((res) => {
                    hxQuestion.reloadServer(res.body);
                    comparator.question(hxQuestion.client(index), res.body);
                })
                .end(done);
        };
    }

    verifyQuestionFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxQuestion = this.hxQuestion;
        return function verifyQuestion() {
            const question = hxQuestion.server(index);
            return rrSuperTest.get(`/questions/${question.id}`, true, 200)
                .then((res) => {
                    expect(res.body).to.deep.equal(question);
                });
        };
    }

    deleteQuestionFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxQuestion = this.hxQuestion;
        return function deleteQuestion(done) {
            const id = hxQuestion.id(index);
            rrSuperTest.delete(`/questions/${id}`, 204)
                .expect(() => {
                    hxQuestion.remove(index);
                })
                .end(done);
        };
    }

    listQuestionsFn(scope) {
        const rrSuperTest = this.rrSuperTest;
        const hxQuestion = this.hxQuestion;
        const query = scope ? { scope } : undefined;
        return function listQuestion(done) {
            rrSuperTest.get('/questions', true, 200, query)
                .expect((res) => {
                    const fields = getFieldsForList(scope);
                    const expected = hxQuestion.listServers(fields);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    }
};

module.exports = {
    getFieldsForList,
    SpecTests,
    IntegrationTests,
    updateIds,
};
