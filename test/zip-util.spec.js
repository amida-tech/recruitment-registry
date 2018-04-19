/* global describe,before,it,afterEach */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

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

    const sampleDataWithCustomDistance = zipUtilCommon.getSampleData(generator, null, true);
    const stubRequestWithCustomDistanceGetSuccessful = function stubRequestWithCustomDistanceGetSuccessful() {
        return shared.stubRequestGet(null, {
            statusCode: 200,
            body: sampleDataWithCustomDistance.apiResponse,
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

    it('calls zip code api with range of 1 mile (custom distance)', () => {
        const requestStub = stubRequestWithCustomDistanceGetSuccessful();
        return zipUtil.findVicinity(sampleDataWithCustomDistance.zip, 1)
            .then(() => expect(requestStub.callCount).to.equal(1));
    });

    it('parses zip code api response', () => {
        stubRequestGetSuccessful();
        return zipUtil.findVicinity(sampleData.zip).then((zipCodes) => {
            expect(zipCodes).to.be.an('array');
            expect(zipCodes).to.deep.equal(sampleData.vicinity);
        });
    });

    it('parses zip code api within 1 mile response (custom distance)', () => {
        stubRequestWithCustomDistanceGetSuccessful();
        return zipUtil.findVicinity(sampleDataWithCustomDistance.zip, 1).then((zipCodes) => {
            expect(zipCodes).to.be.an('array');
            expect(zipCodes).to.deep.equal(sampleDataWithCustomDistance.vicinity);
        });
    });

    const NUM_PAGES = 5;
    const stubRequestGetPaginated = function stubRequestGetPaginated() {
        let page = 0;
        return shared.stubRequestGet(null, () => {
            page += 1;
            return {
                statusCode: 200,
                body: (page === NUM_PAGES) ? sampleData.apiResponse : sampleData.fullApiResponse,
            };
        });
    };
    it('paginates if necessary', () => {
        const requestStub = stubRequestGetPaginated();
        return zipUtil.findVicinity(sampleData.zip)
            .then(() => {
                expect(requestStub.callCount).to.equal(NUM_PAGES);
                [...Array(NUM_PAGES)].forEach((v, page) => {
                    expect(requestStub.args[page][0].qs.page).to.equal(page);
                });
            });
    });

    it('trims spaces from canadian zip codes', () => {
        const response = Object.assign({}, sampleData.apiResponse);
        response.results[0].zip = 'M4B 1E1';
        shared.stubRequestGet(null, {
            statusCode: 200,
            body: response,
        });
        return zipUtil.findVicinity(sampleData.zip)
            .then((zips) => {
                expect(zips).to.include('M4B1E1');
                expect(zips).to.not.include('M4B 1E1');
            });
    });

    it('error: error in zip code api', () => {
        const errorMsg = 'Internal server error';
        shared.stubRequestGet(null, {
            statusCode: 200,
            body: {
                results: {
                    error: errorMsg,
                },
            },
        });
        return zipUtil.findVicinity(sampleData.zip)
            .then(shared.throwingHandler, shared.expectedErrorHandler('zipApiError', errorMsg));
    });

    it('error: timeout to API', () => {
        shared.stubRequestGet(() => {
            const e = new Error('ETIMEDOUT');
            e.code = 'ETIMEDOUT';
            return e;
        });
        return zipUtil.findVicinity(sampleData.zip)
            .then(shared.throwingHandler, shared.expectedErrorHandler('zipApiError', 'ETIMEDOUT'));
    });

    afterEach(() => {
        if (request.get.restore) { request.get.restore(); }
    });
});
