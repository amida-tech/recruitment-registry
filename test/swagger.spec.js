/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');
const st = require('swagger-tools');

const swaggerJson = require('../swagger.json');

const expect = chai.expect;
const spec = st.specs.v2;

describe('swagger validations', () => {
    const objectTypes = [
        'newSurvey', 'newQuestion', 'language',
    ];

    const testValidFn = function (objectType, data) {
        return function (done) {
            spec.validateModel(swaggerJson, `#/definitions/${objectType}`, data, (err, result) => {
                if (err) {
                    return done(err);
                }
                expect(Boolean(result)).to.equal(false, JSON.stringify(result, undefined, 4));
                return done();
            });
        };
    };

    // const testInvalidFn = function (objectType, data) {
    //    return function (done) {
    //        spec.validateModel(swaggerJson, `#/definitions/${objectType}`, data, function (err, result) {
    //            if (err) {
    //                return done(err);
    //            }
    //            expect(Boolean(result)).to.equal(true);
    //            done();
    //        });
    //    };
    // };

    objectTypes.forEach((objectType) => {
        const kebabObjectType = _.kebabCase(objectType);

        const valids = require(`./fixtures/valids/${kebabObjectType}`);
        valids.forEach((valid, index) => {
            it(`valid ${objectType} case ${index}`, testValidFn(objectType, valid));
        });

        // const invalids = require(`./fixtures/swagger-invalid/${kebabObjectType}`);
        // for (let j = 0; j < invalids.length; ++j) {
        //    it(`invalid ${objectTypes[i]} case ${j}`, testInvalidFn(objectTypes[i], invalids[j]));
        // }
    });
});
