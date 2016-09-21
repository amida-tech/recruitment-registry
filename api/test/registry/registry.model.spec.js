/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const models = require('../../models');
const shared = require('../shared-spec.js');
const surveyHelper = require('../helper/survey-helper');
const examples = require('../fixtures/registry-examples');

const expect = chai.expect;

const Registry = models.Registry;

describe('registry unit', function () {
    before(shared.setUpFn());

    const ids = [];

    const registryBasicFn = function (index) {
        return function () {
            return Registry.createRegistry(examples[index])
                .then(({ id }) => {
                    ids.push(id);
                });
        };
    };

    const verifyFn = function (index) {
        return function () {
            return Registry.getRegistry(ids[index])
                .then(actual => {
                    expect(actual.name).to.equal(examples[index].name);
                    return surveyHelper.buildServerSurveyFromClientSurvey(examples[index].survey, actual.survey)
                        .then(function (expected) {
                            expect(actual.survey).to.deep.equal(expected);
                        });
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`create registry ${i}`, registryBasicFn(i));
        it(`get registry ${i} and verify`, verifyFn(i));
    }
});
