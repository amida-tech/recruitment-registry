/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const expect = chai.expect;

const jsutil = require('../lib/jsutil');

describe('question-type unit', function () {
    it('case 0', function () {
        // [4, 5, 6, 7, 8, 9, 11, 12, 15, 16]
        const input = [
            [5, 6, 11, 12, 15],
            [5, 11, -12, 16],
            [-6, 7, 8, 16]
        ];
        const output = jsutil.findStanding(input);
        expect(output).to.deep.equal([
            [15],
            [5, 11],
            [7, 8, 16]
        ]);
    });

    it('case 1', function () {
        // [4, 5, 6, 7, 8, 9, 11, 12, 15, 16]
        const input = [
            [5, 6, 7, 8],
            [5, 6, 7, 8],
            [-5, -7, 8, 16]
        ];
        const output = jsutil.findStanding(input);
        expect(output).to.deep.equal([
            [],
            [6],
            [8, 16]
        ]);
    });
});
