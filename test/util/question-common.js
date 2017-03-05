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
    return questions.map((question) => {
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

const IdentifierGenerator = class identifierGenerator {
    constructor() {
        this.index = 0;
    }

    newAllIdentifiers(question, type) {
        ++this.index;
        const identifier = `qid-${this.index}-${question.id}`;
        const result = { type, identifier };
        const questionType = question.type;
        if ((questionType === 'choice') || (questionType === 'choices')) {
            result.choices = question.choices.map(choice => ({
                answerIdentifier: `cid-${this.index}-${question.id}-${choice.id}`,
                id: choice.id,
            }));
        } else {
            ++this.index;
            const answerIdentifier = `aid-${this.index}-${question.id}`;
            result.answerIdentifier = answerIdentifier;
        }
        return result;
    }

    reset() {
        this.index = 0;
    }
};

const SpecTests = class QuestionSpecTests {
    constructor(generator, hxQuestion) {
        this.generator = generator;
        this.hxQuestion = hxQuestion;
    }

    createQuestionFn(question) {
        const generator = this.generator;
        const hxQuestion = this.hxQuestion;
        return function () {
            question = question || generator.newQuestion();
            return models.question.createQuestion(question)
                .then(({ id }) => hxQuestion.push(question, { id }));
        };
    }

    getQuestionFn(index) {
        const hxQuestion = this.hxQuestion;
        return function () {
            index = (index === undefined) ? hxQuestion.lastIndex() : index;
            const id = hxQuestion.id(index);
            return models.question.getQuestion(id)
                .then((question) => {
                    hxQuestion.updateServer(index, question);
                    comparator.question(hxQuestion.client(index), question);
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
        return function (done) {
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
        return function (done) {
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

    deleteQuestionFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxQuestion = this.hxQuestion;
        return function (done) {
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
        return function (done) {
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
    IdentifierGenerator,
};
