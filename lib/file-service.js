'use strict';

const request = require('request');
const utils = require('./utils');
const config = require('../config');

const fileService = {
    zipAndUploadCsv: csv => new Promise((resolve, reject) => {
        const id = utils.makeRandomString(32);
        const zipPassword = utils.makeRandomString(16);
        request.put({
            uri: `${config.fileServiceApi.baseUrl}/api/v1/file`,
            body: {
                fileContents: csv,
                filename: `${id}.csv`,
                base64Encoded: false,
                zipFileName: `cohorts/${id}.zip`,
                pw: zipPassword,
            },
            json: true,
        }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    s3Url: `https://${config.cohortBucket}.s3.amazonaws.com/cohorts/${id}.zip`,
                    zipPassword,
                });
            }
        });
    }),
};

module.exports = fileService;
