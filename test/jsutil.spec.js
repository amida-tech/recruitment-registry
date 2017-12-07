/* global describe,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');

const expect = chai.expect;

const jsutil = require('../lib/jsutil');
const testJsutil = require('./util/test-jsutil');

describe('errToJSON', () => {
    it('not an object', () => {
        const result = jsutil.errToJSON('string');
        expect(typeof result).to.equal('object');
    });
});

describe('opposite case', () => {
    [
        ['name_1', 'NAME_1'],
        ['nAmE_2', 'NaMe_2'],
        ['NaMe_3', 'nAmE_3'],
        ['NAME_4', 'name_4'],
    ].forEach(([input, expected]) => {
        it(`${input} => ${expected}`, () => {
            const actual = testJsutil.oppositeCase(input);
            expect(actual).to.equal(expected);
        });
    });
});

describe('standing utility', () => {
    it('standing case 0', () => {
        // [4, 5, 6, 7, 8, 9, 11, 12, 15, 16]
        const input = [
            [5, 6, 11, 12, 15],
            [5, 11, -12, 16],
            [-6, 7, 8, 16],
        ];
        const output = testJsutil.findStanding(input);
        expect(output).to.deep.equal([
            [15],
            [5, 11],
            [7, 8, 16],
        ]);
    });

    it('removed case 0', () => {
        // [4, 5, 6, 7, 8, 9, 11, 12, 15, 16]
        const input = [
            [5, 6, 7, 11, 12, 15],
            [5, 11, -12, 16],
            [-6, 7, 8, 16],
        ];
        const output = testJsutil.findRemoved(input);
        expect(output).to.deep.equal([
            [{
                timeIndex: 1,
                removed: [5, 11, 12],
            }, {
                timeIndex: 2,
                removed: [6, 7],
            }],
            [{
                timeIndex: 2,
                removed: [16],
            }],
            [],
        ]);
    });

    it('standing case 1', () => {
        // [4, 5, 6, 7, 8, 9, 11, 12, 15, 16]
        const input = [
            [5, 6, 7, 8],
            [5, 6, 7, 8],
            [-5, -7, 8, 16],
        ];
        const output = testJsutil.findStanding(input);
        expect(output).to.deep.equal([
            [],
            [6],
            [8, 16],
        ]);
    });

    it('remove case 1', () => {
        // [4, 5, 6, 7, 8, 9, 11, 12, 15, 16]
        const input = [
            [5, 6, 7, 8],
            [5, 6, 7, 8],
            [-5, -7, 8, 16],
        ];
        const output = testJsutil.findRemoved(input);
        expect(output).to.deep.equal([
            [{
                timeIndex: 1,
                removed: [5, 6, 7, 8],
            }, {
                timeIndex: 2,
                removed: [],
            }],
            [{
                timeIndex: 2,
                removed: [5, 7, 8],
            }],
            [],
        ]);
    });
});
