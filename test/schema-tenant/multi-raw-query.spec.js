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

describe('multi tenant (for raw query)', function multiTenant4Raw() {
    const schemas = _.range(3).map(index => `schema_${index}`);
    const rrSuperTests = schemas.map(schema => new RRSuperTest(`/${schema}`));
    const generator = new Generator();
    const shareds = rrSuperTests.map(r => new SharedIntegration(r, generator));
    const configClone = _.cloneDeep(config);
    configClone.db.schema = schemas.join('~');
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

    schemas.forEach((schema) => {
        it(`create schema '${schema}'`, function createSchema() {
            return models.sequelize.createSchema(schema);
        });
    });

    it('setup database', SharedIntegration.setUpMultiFn(rrSuperTests, options));

    _.range(3).forEach((schemaIndex) => {
        const shared = shareds[schemaIndex];
        const rrSuperTest = rrSuperTests[schemaIndex];

        it('login as super', shared.loginFn(config.superUser));

        const hxQuestion = new History();
        const tests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });

        _.range(3).forEach((index) => {
            it(`create question ${index}`, tests.createQuestionFn());
            it(`get question ${index}`, tests.getQuestionFn(index));
        });

        it('list questions (complete)', tests.listQuestionsFn('complete'));

        let questionGenerator = null;

        it('replace generator to multiple question generator', () => {
            questionGenerator = generator.questionGenerator;
            const multiGenerator = new MultiQuestionGenerator(generator.questionGenerator);
            generator.questionGenerator = multiGenerator;
        });

        _.range(3, 4 + schemaIndex).forEach((index) => {
            it(`create question ${index}`, tests.createQuestionFn());
            it(`get question ${index}`, tests.getQuestionFn(index));
        });

        it('list questions (complete)', tests.listQuestionsFn('complete'));

        it('revert question generator to single', function revertGenerator() {
            generator.questionGenerator = questionGenerator;
        });

        it('logout as super', shared.logoutFn());
    });

    const multiCountFn = function (index) {
        return function multiCount() {
            return rrSuperTests[index].get('/questions-multi-count', true, 200)
                .then(res => expect(res.body.count).to.equal(`${index + 1}`));
        };
    };

    _.range(3).forEach((schemaIndex) => {
        const shared = shareds[schemaIndex];
        it('login as super', shared.loginFn(config.superUser));

        it('raw query multi count', multiCountFn(schemaIndex));

        it('logout as super', shared.logoutFn());
    });

    it('close connections', function closeSequelize() {
        return rrSuperTests[0].shutDown();
    });
});
