/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');
const st = require('swagger-tools');

const swaggerJson = require('../swagger.json');

const expect = chai.expect;
const spec = st.specs.v2;

describe('swagger validations', function () {
    const objectTypes = [
        'newSurvey', 'newQuestion', 'language'
    ];

    const testValidFn = function (objectType, data) {
        return function (done) {
            spec.validateModel(swaggerJson, `#/definitions/${objectType}`, data, function (err, result) {
                if (err) {
                    return done(err);
                }
                expect(Boolean(result)).to.equal(false, JSON.stringify(result, undefined, 4));
                done();
            });
        };
    };

    //const testInvalidFn = function (objectType, data) {
    //    return function (done) {
    //        spec.validateModel(swaggerJson, `#/definitions/${objectType}`, data, function (err, result) {
    //            if (err) {
    //                return done(err);
    //            }
    //            expect(Boolean(result)).to.equal(true);
    //            done();
    //        });
    //    };
    //};

    for (let i = 0; i < objectTypes.length; ++i) {
        const kebabObjectType = _.kebabCase(objectTypes[i]);

        const valids = require(`./fixtures/valids/${kebabObjectType}`);
        for (let j = 0; j < valids.length; ++j) {
            it(`valid ${objectTypes[i]} case ${j}`, testValidFn(objectTypes[i], valids[j]));
        }

        //const invalids = require(`./fixtures/swagger-invalid/${kebabObjectType}`);
        //for (let j = 0; j < invalids.length; ++j) {
        //    it(`invalid ${objectTypes[i]} case ${j}`, testInvalidFn(objectTypes[i], invalids[j]));
        //}
    }
});
