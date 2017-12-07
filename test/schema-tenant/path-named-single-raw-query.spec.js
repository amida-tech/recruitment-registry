/* global describe,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/generator');
const MultiQuestionGenerator = require('../util/generator/multi-question-generator');
const History = require('../util/history');
const questionCommon = require('../util/question-common');
const models = require('../../models');

const swaggerObject = require('../../swagger.json');

const expect = chai.expect;

describe('tenant single schema named (for raw query)', function tenantNamed4Raw() {
    const rrSuperTest = new RRSuperTest('/named');
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const configClone = _.cloneDeep(config);
    configClone.db.schema = 'named';
    configClone.db.addSchemaPath = true;
    const options = { config: configClone, generatedb: true };

    it('update options', function updateOptions() {
        const newSwaggerObj = _.cloneDeep(swaggerObject);
        newSwaggerObj.paths['/questions-multi-count'] = {
            'x-swagger-router-controller': 'addl-question.controller',
            get: {
                summary: 'Gets count of multi questions',
                operationId: 'getMultiCount',
                responses: {
                    200: {
                        description: 'Successful response',
                        schema: {
                            type: 'object',
                        },
                    },
                    default: {
                        $ref: '#/responses/genericError',
                    },
                },
            },
        };
        options.swaggerJson = newSwaggerObj;
        options.controllers = ['./controllers', './test/controllers'];
    });

    it('clean up public tables and all schemas', function cleanup() {
        return models.sequelize.getQueryInterface().dropAllTables()
            .then(() => models.sequelize.dropAllSchemas());
    });

    it('error: setup database without named schema', shared.setUpErrFn(options));

    it('create schema \'named\'', () => models.sequelize.createSchema('named'));

    it('setup database', shared.setUpFn(options));

    it('login as super', shared.loginFn(config.superUser));

    const hxQuestion = new History();
    const tests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });

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

    const multiCount = function () {
        return rrSuperTest.get('/questions-multi-count', true, 200)
            .then(res => expect(res.body.count).to.equal('4'));
    };

    it('raw query multi count', multiCount);

    it('logout as super', shared.logoutFn());

    it('close connections', function closeSequelize() {
        return rrSuperTest.shutDown();
    });
});
