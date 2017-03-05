/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');
const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('question identifier integration', () => {
    const rrSuperTest = new RRSuperTest();
    const hxQuestion = new History();
    const tests = new questionCommon.SpecTests(generator, hxQuestion);
    const idGenerator = new questionCommon.IdentifierGenerator();
    const hxIdentifiers = {};

    before(shared.setUpFn(rrSuperTest));

    const addIdentifierFn = function (index, type) {
        return function (done) {
            const question = hxQuestion.server(index);
            const allIdentifiers = idGenerator.newAllIdentifiers(question, type);
            let allIdentifiersForType = hxIdentifiers[type];
            if (!allIdentifiersForType) {
                allIdentifiersForType = {};
                hxIdentifiers[type] = allIdentifiersForType;
            }
            allIdentifiersForType[question.id] = allIdentifiers;
            rrSuperTest.post(`/questions/${question.id}/identifiers`, allIdentifiers, 204).end(done);
        };
    };

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    _.range(20).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
        it(`add cc type id to question ${index}`, addIdentifierFn(index, 'cc'));
    });

    it('reset identifier generator', () => {
        idGenerator.reset();
    });

    it('error: cannot specify same type/value identifier', (done) => {
        const question = hxQuestion.server(0);
        const allIdentifiers = idGenerator.newAllIdentifiers(question, 'cc');
        rrSuperTest.post(`/questions/${question.id}/identifiers`, allIdentifiers, 400).end(done);
    });

    it('reset identifier generator', () => {
        idGenerator.reset();
    });

    _.range(20).forEach((index) => {
        it(`add au type id to question ${index}`, addIdentifierFn(index, 'au'));
    });

    _.range(20).forEach((index) => {
        it(`add ot type id to question ${index}`, addIdentifierFn(index, 'ot'));
    });

    const verifyQuestionIdentifiersFn = function (index, type) {
        return function (done) {
            const id = hxQuestion.id(index);
            const allIdentifiers = hxIdentifiers[type][id];
            const identifier = allIdentifiers.identifier;
            rrSuperTest.get(`/question-identifiers/${type}/${identifier}`, true, 200)
                .expect((res) => {
                    const expected = { questionId: id };
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const verifyAnswerIdentifiersFn = function (index, type) {
        return function (done) {
            const question = hxQuestion.server(index);
            const allIdentifiers = hxIdentifiers[type][question.id];
            const questionType = question.type;
            if (questionType === 'choice' || questionType === 'choices') {
                let count = 0;
                question.choices.map(({ id: questionChoiceId }, choiceIndex) => {
                    const identifier = allIdentifiers.choices[choiceIndex].answerIdentifier;
                    rrSuperTest.get(`/answer-identifiers/${type}/${identifier}`, true, 200)
                        .expect((res) => {
                            const expected = { questionId: question.id, questionChoiceId };
                            expect(res.body).to.deep.equal(expected);
                        })
                        .end(() => {
                            ++count;
                            if (count === question.choices.length) {
                                done();
                            }
                        });
                });
            } else {
                const identifier = allIdentifiers.answerIdentifier;
                rrSuperTest.get(`/answer-identifiers/${type}/${identifier}`, allIdentifiers, 200)
                    .expect((res) => {
                        const expected = { questionId: question.id };
                        expect(res.body).to.deep.equal(expected);
                    })
                    .end(done);
            }
        };
    };

    _.range(20).forEach((index) => {
        it(`verify cc type id to question ${index}`, verifyQuestionIdentifiersFn(index, 'cc'));
        it(`verify ot type id to question ${index}`, verifyQuestionIdentifiersFn(index, 'ot'));
        it(`verify au type id to question ${index}`, verifyQuestionIdentifiersFn(index, 'au'));
    });

    _.range(20).forEach((index) => {
        it(`verify cc type answer id to question ${index}`, verifyAnswerIdentifiersFn(index, 'cc'));
        it(`verify ot type answer id to question ${index}`, verifyAnswerIdentifiersFn(index, 'ot'));
        it(`verify au type answer id to question ${index}`, verifyAnswerIdentifiersFn(index, 'au'));
    });

    it('logout as super', shared.logoutFn(rrSuperTest));
});
