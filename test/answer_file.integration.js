/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const questionCommon = require('./util/question-common');

describe('question integration', () => {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const user = generator.newUser();
    const hxUser = new History();

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    it('create a new user', shared.createUserFn(hxUser, user));

    const hxQuestion = new History();
    const tests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });

    it('create question of type integer', tests.createQuestionFn({ type: 'integer' }));
    it('create question of type text', tests.createQuestionFn({ type: 'text' }));
    it('create question of type file', tests.createQuestionFn({ type: 'file' }));

    it('get question of type integer', tests.getQuestionFn(0));
    it('get question of type text', tests.getQuestionFn(0));
    it('get question of type file', tests.getQuestionFn(0));
});
