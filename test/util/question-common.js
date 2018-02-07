'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const SPromise = require('../../lib/promise');
const comparator = require('./comparator');
const errSpec = require('./err-handler-spec');

const scopeToFieldsMap = {
    summary: ['id', 'isIdentifying', 'scaleLimits', 'type', 'text', 'instruction'],
    complete: null,
    export: ['id', 'isIdentifying', 'scaleLimits', 'type', 'text', 'instruction', 'choices', 'meta'],
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

const BaseTests = class BaseTests {
    constructor({ generator, hxQuestion, idGenerator, hxIdentifiers }) {
        this.generator = generator;
        this.hxQuestion = hxQuestion;
        this.idGenerator = idGenerator;
        this.hxIdentifiers = hxIdentifiers;
    }

    addIdentifierFn(index, type) {
        const hxQuestion = this.hxQuestion;
        const idGenerator = this.idGenerator;
        const hxIdentifiers = this.hxIdentifiers;
        const self = this;
        return function addIdentifier() {
            const question = hxQuestion.server(index);
            const identifiers = idGenerator.newIdentifiers(question, type);
            let identifiers4Type = hxIdentifiers[type];
            if (!identifiers4Type) {
                identifiers4Type = {};
                hxIdentifiers[type] = identifiers4Type;
            }
            identifiers4Type[question.id] = identifiers;
            return self.addIdentifierPx(question.id, identifiers);
        };
    }

    verifyQuestionIdentifiersFn(index, inputType) {
        const hxQuestion = this.hxQuestion;
        const hxIdentifiers = this.hxIdentifiers;
        const self = this;
        return function verifyQuestionIdentifiers() {
            const id = hxQuestion.id(index);
            const identifiers = hxIdentifiers[inputType][id];
            const { type, identifier } = identifiers;
            return self.getQuestionIdByIdentifierPx(type, identifier)
                .then((result) => {
                    const expected = { questionId: id };
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    verifyAnswerIdentifiersFn(index, inputType) {
        const hxQuestion = this.hxQuestion;
        const hxIdentifiers = this.hxIdentifiers;
        const self = this;
        return function verifyAnswerIdentifiers() {
            const question = hxQuestion.server(index);
            const identifiers = hxIdentifiers[inputType][question.id];
            const questionType = question.type;
            if (questionType === 'choice' || questionType === 'choices') {
                const { type, answerIdentifiers } = identifiers;
                const pxs = question.choices.map(({ id: questionChoiceId }, choiceIndex) => {
                    const choiceIden = answerIdentifiers[choiceIndex].identifier;
                    return self.getIdsByAnswerIdentifierPx(type, choiceIden)
                        .then((result) => {
                            const expected = { questionId: question.id, questionChoiceId };
                            expect(result).to.deep.equal(expected);
                        });
                });
                return SPromise.all(pxs);
            }
            const { type, answerIdentifier } = identifiers;
            return self.getIdsByAnswerIdentifierPx(type, answerIdentifier)
                    .then((result) => {
                        const expected = { questionId: question.id };
                        expect(result).to.deep.equal(expected);
                    });
        };
    }

    resetIdentifierGeneratorFn() {
        const idGenerator = this.idGenerator;
        return function resetIdentifierGenerator() {
            idGenerator.reset();
        };
    }

    sanityCheckOptions(question, options = {}) { // eslint-disable-line class-methods-use-this
        if (options.multi) {
            expect(question.multiple).to.equal(true);
        }
    }

    getQuestionFn(index, options = {}, overrideComparatorOptions = {}) {
        const hxQuestion = this.hxQuestion;
        const self = this;
        return function getQuestion() {
            index = (index === undefined) ? hxQuestion.lastIndex() : index;
            const id = hxQuestion.id(index);
            return self.getQuestionPx(id, options)
                .then((question) => {
                    hxQuestion.updateServer(index, question);
                    const comparatorOptions = _.cloneDeep(overrideComparatorOptions);
                    if (options.federated && self.hxIdentifiers) {
                        comparatorOptions.identifiers = self.hxIdentifiers.federated;
                    }
                    comparator.question(hxQuestion.client(index), question, comparatorOptions);
                });
        };
    }

    listQuestionsFn(options) {
        const hxQuestion = this.hxQuestion;
        const self = this;
        return function listQuestions() {
            let query;
            if (options) {
                if (typeof options === 'string') {
                    query = { scope: options };
                } else {
                    query = _.omit(options, 'indices');
                }
            }
            const indices = options && options.indices;
            return self.listQuestionsPx(query)
                .then((questions) => {
                    const fields = getFieldsForList(query && query.scope);
                    let expected = hxQuestion.listServers(fields, indices);
                    if (options && options.federated) {
                        const federatedMap = self.hxIdentifiers.federated;
                        expected = expected.reduce((r, question) => {
                            const federatedInfo = federatedMap[question.id];
                            if (federatedInfo) {
                                const identifier = federatedInfo.identifier;
                                const newQuestion = Object.assign({ identifier }, question);
                                r.push(newQuestion);
                            }
                            return r;
                        }, []);
                    }
                    expect(questions).to.deep.equal(expected);
                });
        };
    }

    patchQuestionFn(index, patch, options = {}) {
        const self = this;
        return function patchQuestion() {
            const question = self.hxQuestion.server(index);
            Object.assign(question, patch);
            _.forOwn(patch, (value, key) => {
                if (value === null) {
                    if (key === 'common') {
                        question.common = false;
                        return;
                    }
                    delete question[key];
                }
            });
            const payload = _.omit(question, 'id');
            if (options.force) {
                payload.force = true;
            }
            return self.patchQuestionPx(question.id, payload);
        };
    }

    errorPatchQuestionFn(index, patch, options) {
        const self = this;
        return function patchQuestion() {
            const question = _.cloneDeep(self.hxQuestion.server(index));
            Object.assign(question, patch);
            let errFn;
            if (options.errorParam) {
                errFn = errSpec.expectedErrorHandlerFn(options.error, options.errorParam);
            } else {
                errFn = errSpec.expectedErrorHandlerFn(options.error);
            }
            return self.patchQuestionPx(question.id, _.omit(question, 'id'))
                .then(errSpec.throwingHandler, errFn);
        };
    }
};

const SpecTests = class QuestionSpecTests extends BaseTests {
    constructor(helpers, inputModels) {
        super(helpers);
        this.models = inputModels || models;
    }

    createQuestionFn(options = {}) {
        const generator = this.generator;
        const hxQuestion = this.hxQuestion;
        const m = this.models;
        const self = this;
        return function createQuestion() {
            const question = options.question || generator.newQuestion(options);
            self.sanityCheckOptions(question, options);
            return m.question.createQuestion(question)
                .then(({ id }) => hxQuestion.push(question, { id }));
        };
    }

    getQuestionPx(id, options) {
        return this.models.question.getQuestion(id, options);
    }

    verifyQuestionFn(index, options = {}) {
        const hxQuestion = this.hxQuestion;
        return function verifyQuestion() {
            const question = hxQuestion.server(index);
            return models.question.getQuestion(question.id)
                .then((result) => {
                    if (options.updateMissingChoiceIds) {
                        question.choices.forEach((choice, cindex) => {
                            if (!choice.id) {
                                choice.id = result.choices[cindex].id;
                            }
                        });
                    }
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

    listQuestionsPx(options) {
        return this.models.question.listQuestions(options);
    }

    addIdentifierPx(questionId, allIdentifiers) {
        return this.models.question.addQuestionIdentifiers(questionId, allIdentifiers);
    }

    getQuestionIdByIdentifierPx(type, identifier) {
        return this.models.questionIdentifier.getQuestionIdByIdentifier(type, identifier);
    }

    getIdsByAnswerIdentifierPx(type, answerIdentifier) {
        return this.models.answerIdentifier.getIdsByAnswerIdentifier(type, answerIdentifier);
    }

    patchQuestionPx(id, patch) {
        return this.models.question.patchQuestion(id, patch);
    }
};

const IntegrationTests = class QuestionIntegrationTests extends BaseTests {
    constructor(rrSuperTest, helpers) {
        super(helpers);
        this.rrSuperTest = rrSuperTest;
    }

    createQuestionFn(options = {}) {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxQuestion = this.hxQuestion;
        const self = this;
        return function createQuestion() {
            const question = options.question || generator.newQuestion(options);
            self.sanityCheckOptions(question, options);
            return rrSuperTest.post('/questions', question, 201)
                .then((res) => {
                    hxQuestion.push(question, res.body);
                });
        };
    }
    getQuestionPx(id, query) {
        return this.rrSuperTest.get(`/questions/${id}`, true, 200, query).then(res => res.body);
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
        return function deleteQuestion() {
            const id = hxQuestion.id(index);
            return rrSuperTest.delete(`/questions/${id}`, 204)
                .then(() => {
                    hxQuestion.remove(index);
                });
        };
    }

    listQuestionsPx(query) {
        const options = query && _.omit(query, ['surveyPublished']);
        if (query && query.surveyPublished) {
            options['survey-published'] = true;
        }
        return this.rrSuperTest.get('/questions', true, 200, options).then(res => res.body);
    }

    addIdentifierPx(questionId, allIdentifiers) {
        return this.rrSuperTest.post(`/questions/${questionId}/identifiers`, allIdentifiers, 204);
    }

    getQuestionIdByIdentifierPx(type, identifier) {
        return this.rrSuperTest.get(`/question-identifiers/${type}/${identifier}`, true, 200)
            .then(res => res.body);
    }

    getIdsByAnswerIdentifierPx(type, answerIdentifier) {
        const endpoint = `/answer-identifiers/${type}/${answerIdentifier}`;
        return this.rrSuperTest.get(endpoint, false, 200).then(res => res.body);
    }

    patchQuestionPx(id, patch) {
        const endpoint = `/questions/${id}`;
        return this.rrSuperTest.post(endpoint, patch, 204);
    }
};

module.exports = {
    getFieldsForList,
    SpecTests,
    IntegrationTests,
    updateIds,
};
