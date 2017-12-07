/* global describe,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');

const RRError = require('../lib/rr-error');
const i18n = require('../i18n');

const expect = chai.expect;

describe('rr-error unit', () => {
    const testFn = function (language, result) {
        return function test() {
            const err = new RRError('test');
            const req = {};
            const res = {};
            if (language) {
                const url = `http://api/questions/1?language=${language}`;
                req.url = url;
            }
            i18n.init(req, res, () => {});
            expect(err.getMessage(res)).to.equal(result);
            expect(err).to.be.instanceof(Error);
            expect(err.code).to.equal('test');
            expect(err.params).to.deep.equal([]);
        };
    };

    it('text only no langauge', testFn(null, 'Testing.'));
    it('text only english', testFn('en', 'Testing.'));
    it('text only spanish', testFn('es', 'Pruebas.'));

    const testParams1Fn = function (language, result) {
        return function test() {
            const err = new RRError('testParams1', 'param');
            const req = {};
            const res = {};
            if (language) {
                const url = `http://api/questions/1?language=${language}`;
                req.url = url;
            }
            i18n.init(req, res, () => {});
            expect(err.getMessage(res)).to.equal(result);
            expect(err).to.be.instanceof(Error);
            expect(err.code).to.equal('testParams1');
            expect(err.params).to.deep.equal(['param']);
        };
    };

    it('1 param only no langauge', testParams1Fn(null, 'Testing param.'));
    it('1 param only english', testParams1Fn('en', 'Testing param.'));
    it('1 param only spanish', testParams1Fn('es', 'Pruebas param.'));

    const testParams2Fn = function (language, result) {
        return function test() {
            const err = new RRError('testParams2', 'a', 'b');
            const req = {};
            const res = {};
            if (language) {
                const url = `http://api/questions/1?language=${language}`;
                req.url = url;
            }
            i18n.init(req, res, () => {});
            expect(err.getMessage(res)).to.equal(result);
            expect(err).to.be.instanceof(Error);
            expect(err.code).to.equal('testParams2');
            expect(err.params).to.deep.equal(['a', 'b']);
        };
    };

    it('2 params only no langauge', testParams2Fn(null, 'Testing b and a and b.'));
    it('2 params only english', testParams2Fn('en', 'Testing b and a and b.'));
    it('2 params only spanish', testParams2Fn('es', 'Pruebas b y a y b.'));

    const unknownFn = function (language, result) {
        return function unknown() {
            const err = new RRError('not-existing', 'a', 'b');
            const req = {};
            const res = {};
            if (language) {
                const url = `http://api/questions/1?language=${language}`;
                req.url = url;
            }
            i18n.init(req, res, () => {});
            expect(err.getMessage(res)).to.equal(result);
            expect(err).to.be.instanceof(Error);
            expect(err.code).to.equal('not-existing');
            expect(err.params).to.deep.equal(['a', 'b']);
        };
    };

    it('unknown only no langauge', unknownFn(null, 'Internal unknown error.'));
    it('unknown only english', unknownFn('en', 'Internal unknown error.'));
    it('unknown only spanish', unknownFn('es', 'Error interno desconocido.'));

    it('reject', function reject() {
        return RRError.reject('test')
            .then(() => { throw new Error('unexpected no error'); })
            .catch((err) => {
                expect(err).to.be.instanceof(RRError);
                expect(err).to.be.instanceof(Error);
                expect(err.code).to.equal('test');
                expect(err.params).to.deep.equal([]);
            });
    });

    const testEnglishOnlyFn = function (language, result) {
        return function test() {
            const err = new RRError('testEnglishOnly', 'param');
            const req = {};
            const res = {};
            if (language) {
                const url = `http://api/questions/1?language=${language}`;
                req.url = url;
            }
            i18n.init(req, res, () => {});
            expect(err.getMessage(res)).to.equal(result);
            expect(err).to.be.instanceof(Error);
            expect(err.code).to.equal('testEnglishOnly');
            expect(err.params).to.deep.equal(['param']);
        };
    };

    it('english only no langauge', testEnglishOnlyFn(null, 'Should show for language param as well'));
    it('english only english', testEnglishOnlyFn('en', 'Should show for language param as well'));
    it('english only spanish', testEnglishOnlyFn('es', 'Should show for language param as well'));
});
