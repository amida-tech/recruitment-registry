'use strict';

const request = require('request');

const RRError = require('../../lib/rr-error');

const requestPost = function (registryName, questions, url, endpoint) {
    const opts = {
        json: true,
        body: questions,
        url: `${url}/${endpoint}`,
    };
    const key = `RECREG_JWT_${registryName}`;
    const jwt = process.env[key];
    if (key) {
        opts.headers = {
            authorization: `Bearer ${jwt}`,
        };
    }

    return new Promise((resolve, reject) => (
        request.post(opts, (err, res) => {
            if (err) {
                const rrerror = new RRError('answerRemoteRegistryError', registryName, err.message);
                return reject(rrerror);
            }
            if (res.statusCode !== 200) {
                const rrerror = new RRError('answerRemoteRegistryError', registryName, res.body.message);
                return reject(rrerror);
            }
            return resolve(res.body);
        })
    ));
};

module.exports = {
    requestPost,
};
