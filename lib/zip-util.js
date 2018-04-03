'use strict';

const request = require('request');

const RRError = require('./rr-error');
const zipConfig = require('../config').zipCodeApi;

const requestGet = function requestGet(opts) {
    return new Promise((resolve, reject) => (
        request.get(opts, (err, data) => {
            if (err) { return reject(err); }
            return resolve(data);
        })
    ));
};

const makeVicinityRequest = function makeVicinityRequest(zip, page, customDistance) {
    const format = 'json';
    const radius = customDistance || zipConfig.distance || 50;
    const key = zipConfig.apiKey;
    const qs = { key, radius, zip, format, page };
    return { json: true, url: zipConfig.baseUrl, qs };
};

const formatZip = function formatZip(zip) {
    return zip && zip.replace(/ /g, '');
};

const MAX_RESULTS = 250;
const parseVicinityResponse = function parseVicinityResponse(result, page, zip) {
    if (result.statusCode !== 200 || !result.body.results || result.body.results.error) {
        return RRError.reject('zipApiError', (result.body.results || {}).error);
    }

    const zips = result.body.results.map(datum => formatZip(datum.zip));
    if (zips.length === MAX_RESULTS) {
        // eslint-disable-next-line no-use-before-define
        return runVicinity(zip, page + 1).then(pagedZips => [...zips, ...pagedZips]);
    }
    return zips;
};

/* jshint -W003 */
const runVicinity = function runVicinity(zip, page = 0, customDistance) {
    return requestGet(makeVicinityRequest(zip, page, customDistance))
        .then(result => parseVicinityResponse(result, page, zip),
            err => RRError.reject('zipApiError', err.code));
};
/* jshint +W003 */

const findVicinity = function findVicinity(zip, customDistance) {
    if (typeof zip !== 'string' || zip.length === 0) { return RRError.reject('zipInvalidValue', zip); }

    return runVicinity(zip, 0, customDistance);
};

exports.findVicinity = findVicinity;
