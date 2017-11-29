/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');
const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const TypedIndexSet = require('./util/typed-index-set');
const QuestionIdentifierGenerator = require('./util/generator/question-identifier-generator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');

describe('question identifier integration', function questionIdentifierIntegration() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxQuestion = new History();
    const idGenerator = new QuestionIdentifierGenerator();
    const hxIdentifiers = {};
    const qxCommonOptions = { generator, hxQuestion, idGenerator, hxIdentifiers };
    const tests = new questionCommon.IntegrationTests(rrSuperTest, qxCommonOptions);
    const qxIndexSet = new TypedIndexSet();
    const answerIndexSet = new TypedIndexSet();
    let questionCount = 0;

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(5).forEach((index) => {
        it(`create question ${index} (no identifier)`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });
    questionCount += 5;

    _.range(questionCount, questionCount + 20).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
        it(`add question ${index} federated identifier`, tests.addIdentifierFn(index, 'federated'));
        qxIndexSet.addIndex('federated', index);
        answerIndexSet.addIndex('federated', index);
    });
    questionCount += 20;

    it('reset identifier generator', tests.resetIdentifierGeneratorFn());

    it('error: cannot specify same type/value identifier', function errorSame() {
        const question = hxQuestion.server(5);
        const allIdentifiers = idGenerator.newIdentifiers(question, 'federated');
        return rrSuperTest.post(`/questions/${question.id}/identifiers`, allIdentifiers, 400);
    });

    it('reset identifier generator', tests.resetIdentifierGeneratorFn());

    _.range(8, 18).forEach((index) => {
        it(`add au type id to question ${index}`, tests.addIdentifierFn(index, 'au'));
        qxIndexSet.addIndex('au', index);
        answerIndexSet.addIndex('au', index);
    });

    _.range(questionCount, questionCount + 8).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
        it(`add question ${index} au identifier`, tests.addIdentifierFn(index, 'au'));
        qxIndexSet.addIndex('au', index);
        answerIndexSet.addIndex('au', index);
    });
    questionCount += 5;

    _.range(15, 28).forEach((index) => {
        it(`add ot type id to question ${index}`, tests.addIdentifierFn(index, 'ot'));
        qxIndexSet.addIndex('ot', index);
        answerIndexSet.addIndex('ot', index);
    });

    _.range(questionCount).forEach((index) => {
        ['au', 'federated', 'ot'].forEach((type) => {
            if (qxIndexSet.has(type, index)) {
                const msg = `verify ${type} question identifier for question ${index}`;
                it(msg, tests.verifyQuestionIdentifiersFn(index, type));
            }
            if (answerIndexSet.has(type, index)) {
                const msg = `verify ${type} answer identifier for question ${index}`;
                it(msg, tests.verifyAnswerIdentifiersFn(index, type));
            }
        });
    });

    it('list federated questions', tests.listQuestionsFn({ federated: true }));

    _.range(questionCount).forEach((index) => {
        if (qxIndexSet.has('federated', index)) {
            const options = { federated: true };
            it(`get question ${index} with federated identifiers`, tests.getQuestionFn(index, options));
        }
    });

    it('logout as super', shared.logoutFn());
});
