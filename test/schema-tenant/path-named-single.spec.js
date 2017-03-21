/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/generator');
const MultiQuestionGenerator = require('../util/generator/multi-question-generator');
const History = require('../util/history');
const questionCommon = require('../util/question-common');
const sequelizeGenerator = require('../../models/db/sequelize-generator');

describe('tenant single schema path named', function tenantPathNamed() {
    const rrSuperTest = new RRSuperTest('/named');
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const { sequelize: publicSequelize } = sequelizeGenerator('public');

    const configClone = _.cloneDeep(config);
    configClone.db.schema = 'named';
    configClone.db.addSchemaPath = true;
    const options = { config: configClone, generatedb: true };

    it('clean up public tables and all schemas', function cleanup() {
        return publicSequelize.getQueryInterface().dropAllTables()
            .then(() => publicSequelize.dropAllSchemas());
    });

    it('error: setup database without named schema', shared.setUpErrFn(options));

    it('create schema \'named\'', () => publicSequelize.createSchema('named'));

    it('setup database', shared.setUpFn(options));

    it('login as super', shared.loginFn(config.superUser));

    const hxQuestion = new History();
    const tests = new questionCommon.IntegrationTests(rrSuperTest, generator, hxQuestion);

    _.range(3).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });

    it('list questions (complete)', tests.listQuestionsFn('complete'));

    it('replace generator to multiple question generator', () => {
        const multiGenerator = new MultiQuestionGenerator(generator.questionGenerator);
        generator.questionGenerator = multiGenerator;
    });

    _.range(3, 7).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });

    it('list questions (complete)', tests.listQuestionsFn('complete'));

    it('logout as super', shared.logoutFn());
});
