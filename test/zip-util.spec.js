/* global describe,before,it,afterEach*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const request = require('request');

const zipUtil = require('../lib/zip-util');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const zipUtilCommon = require('./util/zip-util-common');

const shared = new SharedSpec();
const generator = new Generator();
const expect = chai.expect;

describe('zip-util unit', () => {
    before(shared.setUpFn());

    const sampleData = zipUtilCommon.getSampleData(generator);
    const stubRequestGetSuccessful = function stubRequestGetSuccessful() {
        return shared.stubRequestGet(null, {
            statusCode: 200,
            body: sampleData.apiResponse,
        });
    };

    ['', null, undefined].forEach((zip) => {
        it(`error: no zip code (${zip})`, () => zipUtil.findVicinity(zip)
                .then(shared.throwingHandler, shared.expectedErrorHandler('zipInvalidValue', zip)));
    });

    it('calls zip code api', () => {
        const requestStub = stubRequestGetSuccessful();
        return zipUtil.findVicinity(sampleData.zip)
            .then(() => expect(requestStub.callCount).to.equal(1));
    });

    it('parses zip code api response', () => {
        stubRequestGetSuccessful();
        return zipUtil.findVicinity(sampleData.zip).then((zipCodes) => {
            expect(zipCodes).to.be.an('array');
            expect(zipCodes).to.deep.equal(sampleData.vicinity);
        });
    });

    it('error: error in zip code api', () => {
        const errorMsg = 'Internal server error';
        shared.stubRequestGet(null, {
            statusCode: 500,
            body: {
                error_code: 500,
                error_msg: errorMsg,
            },
        });
        return zipUtil.findVicinity(sampleData.zip)
            .then(shared.throwingHandler, shared.expectedErrorHandler('zipApiError', 500, errorMsg));
    });

    it('error: timeout to API', () => {
        shared.stubRequestGet(() => {
            const e = new Error('ETIMEDOUT');
            e.code = 'ETIMEDOUT';
            return e;
        });
        return zipUtil.findVicinity(sampleData.zip)
            .then(shared.throwingHandler, shared.expectedErrorHandler('zipApiError', 'ETIMEDOUT', 'ETIMEDOUT'));
    });

    afterEach(() => {
        if (request.get.restore) { request.get.restore(); }
    });
});
