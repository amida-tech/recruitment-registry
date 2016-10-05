/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const expect = chai.expect;

const js = require('../lib/json-schema');

describe('custom json schema', function () {
    let lastErr;
    const res = {
        status: function () { return this; },
        json: function (err) { lastErr = err; }
    };

    it('newSurvey', function () {
        const valids = [{
            name: 'name',
            released: true,
            questions: [{ id: 1 }, { id: 2 }, { id: 3 }]
        }, {
            name: 'name',
            released: false,
            questions: [{
                text: 'What is it?',
                type: 'text',
                selectable: true
            }, {
                text: 'What is it?',
                type: 'text',
                selectable: true
            }]
        }, {
            name: 'name',
            released: false,
            questions: [{
                id: 1
            }, {
                text: 'What is it?',
                type: 'text',
                selectable: true
            }, {
                id: 2
            }]
        }];

        const invalids = [{
            name: 'name',
            released: false,
            questions: [{
                id: 1,
                text: 'What is it?',
                type: 'text',
                selectable: true
            }, {
                text: 'What is it?',
                type: 'text',
                selectable: true
            }]
        }];

        valids.forEach(valid => {
            const r = js('newSurvey', valid, res);
            if (!r) {
                console.log(JSON.stringify(lastErr, undefined, 4));
            }
            expect(r).to.equal(true);
        });

        invalids.forEach(invalid => {
            const r = js('newSurvey', invalid, res);
            expect(r).to.equal(false);
            expect(lastErr).to.have.property('message');
            expect(lastErr).to.have.property('detail');
        });
    });
});
