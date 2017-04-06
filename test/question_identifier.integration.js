/* global describe,before,it*/

'use strict';

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
    const tests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion, idGenerator, hxIdentifiers });
    const qxIndexSet = new TypedIndexSet();
    const answerIndexSet = new TypedIndexSet();
    let questionCount = 0;

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(20).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
        it(`add cc type id to question ${index}`, tests.addIdentifierFn(index, 'cc'));
    });

    questionCount += 20;

    it('reset identifier generator', tests.resetIdentifierGeneratorFn());

    it('error: cannot specify same type/value identifier', function errorSame() {
        const question = hxQuestion.server(0);
        const allIdentifiers = idGenerator.newIdentifiers(question, 'cc');
        return rrSuperTest.post(`/questions/${question.id}/identifiers`, allIdentifiers, 400);
    });

    it('reset identifier generator', tests.resetIdentifierGeneratorFn());

    _.range(questionCount).forEach((index) => {
        it(`add au type id to question ${index}`, tests.addIdentifierFn(index, 'au'));
        qxIndexSet.addIndex('au', index);
        answerIndexSet.addIndex('au', index);
    });

    _.range(questionCount).forEach((index) => {
        it(`add ot type id to question ${index}`, tests.addIdentifierFn(index, 'ot'));
        qxIndexSet.addIndex('ot', index);
        answerIndexSet.addIndex('ot', index);
    });

    _.range(questionCount).forEach((index) => {
        ['au', 'cc', 'ot'].forEach((type) => {
            if (qxIndexSet.has(type, index)) {
                it(`verify ${type} question identifier for question ${index}`, tests.verifyQuestionIdentifiersFn(index, type));
            }
            if (answerIndexSet.has(type, index)) {
                it(`verify ${type} answer identifier for question ${index}`, tests.verifyAnswerIdentifiersFn(index, type));
            }
        });
    });

    it('logout as super', shared.logoutFn());
});
