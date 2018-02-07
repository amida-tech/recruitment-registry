'use strict';

const chai = require('chai');

const RRError = require('../../lib/rr-error');
const i18n = require('../../i18n');

const expect = chai.expect;
const unknownError = new RRError('unknown');

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
        if (fields) {
            expect(err.fields).to.deep.equal(fields);
        }
        return err;
    };
};

const verifyErrorMessage = function (res, code, ...params) {
    const req = {};
    const response = {};
    i18n.init(req, response);
    const expected = (new RRError(code, ...params)).getMessage(response);
    expect(expected).to.not.equal(code);
    expect(expected).to.not.equal(unknownError.getMessage(response));
    expect(res.body.message).to.equal(expected);
};

const verifyErrorMessageLang = function (res, language, code, ...params) {
    const req = { url: `http://aaa.com/anything?language=${language}` };
    const response = {};
    i18n.init(req, response);
    const expected = (new RRError(code, ...params)).getMessage(response);
    expect(expected).to.not.equal(code);
    expect(expected).to.not.equal(unknownError.getMessage(response));
    expect(res.body.message).to.equal(expected);
};

module.exports = {
    throwingHandler,
    expectedErrorHandlerFn,
    expectedSeqErrorHandlerFn,
    verifyErrorMessage,
    verifyErrorMessageLang,
};
