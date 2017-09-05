'use strict';

const awsSdk = require('aws-sdk');

const s3 = new awsSdk.S3({ apiVersion: '2006-03-01' });

const putObject = function (params, callback) {
    s3.putObject(params, callback);
};

module.exports = {
    putObject,
};
