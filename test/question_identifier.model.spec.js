/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SPromise = require('../lib/promise');
const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const QuestionIdentifierGenerator = require('./util/generator/question-identifier-generator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('question identifier unit', () => {
    const hxQuestion = new History();
    const tests = new questionCommon.SpecTests(generator, hxQuestion);
    const idGenerator = new QuestionIdentifierGenerator();
    const hxIdentifiers = {};
    let questionCount = 0;

    before(shared.setUpFn());

    const addIdentifierFn = function (index, type) {
        return function addIdentifier() {
            const question = hxQuestion.server(index);
            const allIdentifiers = idGenerator.newAllIdentifiers(question, type);
            let allIdentifiersForType = hxIdentifiers[type];
            if (!allIdentifiersForType) {
                allIdentifiersForType = {};
                hxIdentifiers[type] = allIdentifiersForType;
            }
            allIdentifiersForType[question.id] = allIdentifiers;
            return models.question.addQuestionIdentifiers(question.id, allIdentifiers);
        };
    };

    _.range(20).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
        it(`add cc type id to question ${index}`, addIdentifierFn(index, 'cc'));
    });

    questionCount += 20;

    it('reset identifier generator', () => {
        idGenerator.reset();
    });

    it('error: cannot specify same type/value identifier', function errorSame() {
        const question = hxQuestion.server(0);
        const allIdentifiers = idGenerator.newAllIdentifiers(question, 'cc');
        const { type, identifier } = allIdentifiers;
        const errorType = 'SequelizeUniqueConstraintError';
        return models.question.addQuestionIdentifiers(question.id, allIdentifiers)
            .then(shared.throwingHandler)
            .catch(shared.expectedSeqErrorHandler(errorType, { type, identifier }));
    });

    it('reset identifier generator', () => {
        idGenerator.reset();
    });

    _.range(questionCount).forEach((index) => {
        it(`add au type id to question ${index}`, addIdentifierFn(index, 'au'));
    });

    _.range(questionCount).forEach((index) => {
        it(`add ot type id to question ${index}`, addIdentifierFn(index, 'ot'));
    });

    const verifyQuestionIdentifiersFn = function (index, inputType) {
        return function verifyQuestionIdentifiers() {
            const id = hxQuestion.id(index);
            const allIdentifiers = hxIdentifiers[inputType][id];
            const { type, identifier } = allIdentifiers;
            return models.questionIdentifier.getQuestionIdByIdentifier(type, identifier)
                .then((result) => {
                    const expected = { questionId: id };
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const verifyAnswerIdentifiersFn = function (index, inputType) {
        return function verifyAnswerIdentifiers() {
            const question = hxQuestion.server(index);
            const allIdentifiers = hxIdentifiers[inputType][question.id];
            const questionType = question.type;
            if (questionType === 'choice' || questionType === 'choices') {
                const { type, choices } = allIdentifiers;
                const pxs = question.choices.map(({ id: questionChoiceId }, choiceIndex) => {
                    const choiceIden = choices[choiceIndex].answerIdentifier;
                    return models.answerIdentifier.getIdsByAnswerIdentifier(type, choiceIden)
                        .then((result) => {
                            const expected = { questionId: question.id, questionChoiceId };
                            expect(result).to.deep.equal(expected);
                        });
                });
                return SPromise.all(pxs);
            }
            const { type, answerIdentifier } = allIdentifiers;
            return models.answerIdentifier.getIdsByAnswerIdentifier(type, answerIdentifier)
                    .then((result) => {
                        const expected = { questionId: question.id };
                        expect(result).to.deep.equal(expected);
                    });
        };
    };

    _.range(questionCount).forEach((index) => {
        it(`verify cc type id to question ${index}`, verifyQuestionIdentifiersFn(index, 'cc'));
        it(`verify ot type id to question ${index}`, verifyQuestionIdentifiersFn(index, 'ot'));
        it(`verify au type id to question ${index}`, verifyQuestionIdentifiersFn(index, 'au'));
    });

    _.range(questionCount).forEach((index) => {
        it(`verify cc type answer id to question ${index}`, verifyAnswerIdentifiersFn(index, 'cc'));
        it(`verify ot type answer id to question ${index}`, verifyAnswerIdentifiersFn(index, 'ot'));
        it(`verify au type answer id to question ${index}`, verifyAnswerIdentifiersFn(index, 'au'));
    });
});
