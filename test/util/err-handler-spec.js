'use strict';

const chai = require('chai');

const RRError = require('../../lib/rr-error');

const expect = chai.expect;

const throwingHandler = function () {
    throw new Error('Unexpected no error.');
};

const expectedErrorHandlerFn = function (code, ...params) {
    return function expectedErrorHandler(err) {
        if (!(err instanceof RRError)) {
            console.log(err); // eslint-disable-line no-console
        }
        expect(err).to.be.instanceof(RRError);
        expect(err.code).to.equal(code);
        expect(err.params).to.deep.equal(params);
        return err;
    };
};

const expectedSeqErrorHandlerFn = function (name, fields) {
    return function expectedSeqErrorHandler(err) {
        expect(err.name).to.equal(name);
        expect(err.fields).to.deep.equal(fields);
        return err;
    };
};

module.exports = {
    throwingHandler,
    expectedErrorHandlerFn,
    expectedSeqErrorHandlerFn,
};
