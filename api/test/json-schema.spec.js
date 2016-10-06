/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const expect = chai.expect;

const js = require('../lib/json-schema');

describe('custom json schema', function () {
    let lastErr;
    let lastStatusCode;
    const res = {
        status: function (statusCode) { lastStatusCode = statusCode; return this; },
        json: function (err) { lastErr = err; }
    };

    it('invalid object key', function () {
        const r = js('newSurveyXXX', { a: 1 }, res);
        expect(r).to.equal(false, 'invalid key no error');
        expect(lastErr).to.have.property('message');
        expect(lastStatusCode).to.equal(500);
    });

    it('newSurvey', function () {
        const valids = [{
            name: 'name',
            questions: [{ id: 1 }, { id: 2 }, { id: 3 }]
        }, {
            name: 'name',
            questions: [{
                text: 'What is it?',
                type: 'text'
            }, {
                text: 'What is it?',
                type: 'text'
            }]
        }, {
            name: 'name',
            questions: [{
                id: 1
            }, {
                text: 'What is it?',
                type: 'text'
            }, {
                id: 2
            }]
        }];

        const invalids = require('./fixtures/invalid-new-surveys');

        valids.forEach(valid => {
            const r = js('newSurvey', valid, res);
            expect(r).to.equal(true, lastErr);
        });

        invalids.forEach(invalid => {
            const r = js('newSurvey', invalid, res);
            expect(r).to.equal(false, (invalid && invalid.name) || 'null');
            expect(lastErr).to.have.property('message');
            expect(lastErr).to.have.property('detail');
            expect(lastStatusCode).to.equal(400);
        });
    });
});
