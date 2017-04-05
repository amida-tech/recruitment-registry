/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');
const SPromise = require('../lib/promise');
const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const QuestionIdentifierGenerator = require('./util/generator/question-identifier-generator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');

const expect = chai.expect;

describe('question identifier integration', () => {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
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
            return rrSuperTest.post(`/questions/${question.id}/identifiers`, allIdentifiers, 204);
        };
    };

    it('login as super', shared.loginFn(config.superUser));

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
        return rrSuperTest.post(`/questions/${question.id}/identifiers`, allIdentifiers, 400);
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

    const verifyQuestionIdentifiersFn = function (index, type) {
        return function verifyQuestionIdentifiers() {
            const id = hxQuestion.id(index);
            const allIdentifiers = hxIdentifiers[type][id];
            const identifier = allIdentifiers.identifier;
            return rrSuperTest.get(`/question-identifiers/${type}/${identifier}`, true, 200)
                .then((res) => {
                    const expected = { questionId: id };
                    expect(res.body).to.deep.equal(expected);
                });
        };
    };

    const verifyAnswerIdentifiersFn = function (index, type) {
        return function verifyAnswerIdentifiers() {
            const question = hxQuestion.server(index);
            const allIdentifiers = hxIdentifiers[type][question.id];
            const questionType = question.type;
            if (questionType === 'choice' || questionType === 'choices') {
                const pxs = question.choices.map(({ id: questionChoiceId }, choiceIndex) => {
                    const identifier = allIdentifiers.choices[choiceIndex].answerIdentifier;
                    return rrSuperTest.get(`/answer-identifiers/${type}/${identifier}`, true, 200)
                        .then((res) => {
                            const expected = { questionId: question.id, questionChoiceId };
                            expect(res.body).to.deep.equal(expected);
                        });
                });
                return SPromise.all(pxs);
            }
            const identifier = allIdentifiers.answerIdentifier;
            const endpoint = `/answer-identifiers/${type}/${identifier}`;
            return rrSuperTest.get(endpoint, allIdentifiers, 200)
                    .then((res) => {
                        const expected = { questionId: question.id };
                        expect(res.body).to.deep.equal(expected);
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

    it('logout as super', shared.logoutFn());
});
