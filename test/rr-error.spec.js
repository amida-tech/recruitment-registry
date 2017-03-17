/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const RRError = require('../lib/rr-error');

const expect = chai.expect;

describe('rr-error unit', () => {
    it('text only', () => {
        const err = new RRError('test');
        expect(err.getMessage()).to.equal('Testing.');
        expect(err).to.be.instanceof(RRError);
        expect(err).to.be.instanceof(Error);
        expect(err.code).to.equal('test');
    });

    it('1 param', () => {
        const err = new RRError('testParams1', 'param');
        expect(err.getMessage()).to.equal('Testing param.');
        expect(err).to.be.instanceof(RRError);
        expect(err).to.be.instanceof(Error);
        expect(err.code).to.equal('testParams1');
        expect(err.params).to.deep.equal(['param']);
    });

    it('2 params', () => {
        const err = new RRError('testParams2', 'a', 'b');
        expect(err.getMessage()).to.equal('Testing b and a and b.');
        expect(err).to.be.instanceof(RRError);
        expect(err).to.be.instanceof(Error);
        expect(err.code).to.equal('testParams2');
        expect(err.params).to.deep.equal(['a', 'b']);
    });

    // it('unknown', () => {
    //    const err = new RRError('not-existing', 'a', 'b');
    //    expect(err).to.be.instanceof(RRError);
    //    expect(err).to.be.instanceof(Error);
    //    expect(err.code).to.equal('unknown');
    // });

    it('reject', function reject() {
        return RRError.reject('test')
            .then(() => { throw new Error('unexpected no error'); })
            .catch((err) => {
                expect(err.getMessage()).to.equal('Testing.');
                expect(err).to.be.instanceof(RRError);
                expect(err).to.be.instanceof(Error);
                expect(err.code).to.equal('test');
            });
    });

    it('message for unknown', () => {
        const actual = (new RRError('not-existing')).getMessage();
        const expected = (new RRError('unknown')).getMessage();
        expect(actual).to.equal(expected);
    });
});
