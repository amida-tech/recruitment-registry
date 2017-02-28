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

const makeVicinityRequest = function makeVicinityRequest(zip) {
    const format = 'json';
    const distance = zipConfig.distance || 50;
    const unit = zipConfig.unit || 'mile';

    const url = `${zipConfig.baseUrl}/${zipConfig.apiKey}/radius.${format}/${zip}/${distance}/${unit}`;
    return { json: true, url };
};

const parseVicinityResponse = function parseVicinityResponse(result) {
    if (result.statusCode !== 200 || !result.body.zip_codes) {
        return RRError.reject('zipApiError', result.body.error_code, result.body.error_msg);
    }

    return result.body.zip_codes.map(zipCode => zipCode.zip_code);
};

const findVicinity = function findVicinity(zip) {
    if (typeof zip !== 'string' || zip.length === 0) { return RRError.reject('zipInvalidValue', zip); }

    return requestGet(makeVicinityRequest(zip))
        .then(parseVicinityResponse, err => RRError.reject('zipApiError', err.code, err.message));
};

exports.findVicinity = findVicinity;
