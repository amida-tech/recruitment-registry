/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const expect = chai.expect;

const js = require('../lib/json-schema');

describe('json schema validations', () => {
    const objectTypes = [
        'newSurvey', 'newQuestion', 'answer',
    ];

    let lastErr = {};
    let lastStatusCode;
    const res = {
        status(statusCode) { lastStatusCode = statusCode; return this; },
        json(err) { lastErr = err; },
    };

    it('invalid object key', () => {
        const r = js('newSurveyXXX', { a: 1 }, res);
        expect(r).to.equal(false, 'invalid key no error');
        expect(lastErr).to.have.property('message');
        expect(lastStatusCode).to.equal(500);
    });

    const testFn = function (objectType) {
        return function () {
            const kebabObjectType = _.kebabCase(objectType);

            const valids = require(`./fixtures/valids/${kebabObjectType}`);

            valids.forEach((valid) => {
                const r = js(objectType, valid, res);
                if (!r) {
                    console.log(valid);
                }
                expect(r).to.equal(true, JSON.stringify(lastErr, undefined, 4));
            });

            const invalids = require(`./fixtures/json-schema-invalid/${kebabObjectType}`);

            invalids.forEach((invalid) => {
                const r = js(objectType, invalid, res);
                expect(r).to.equal(false, JSON.stringify(invalid, undefined, 4));
                expect(lastErr).to.have.property('message');
                expect(lastErr).to.have.property('detail');
                expect(lastStatusCode).to.equal(400);
            });
        };
    };

    for (let i = 0; i < objectTypes.length; ++i) {
        it(objectTypes[i], testFn(objectTypes[i]));
    }
});
