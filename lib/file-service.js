'use strict';

const request = require('request');
const utils = require('./utils');
const config = require('../config');

const fileService = {
    zipAndUploadCsv: csv => new Promise((resolve, reject) => {
        console.log('attempting actual file service call');
        const id = utils.makeRandomString(32);
        const zipPassword = utils.makeRandomString(16);
        request.put({
            uri: `${config.fileServiceApi.baseUrl}/api/v1/file`,
            body: {
                fileContents: csv,
                filename: `${id}.csv`,
                base64Encoded: false,
                zipFileName: `${id}.zip`,
                pw: zipPassword,
            },
            json: true,
        }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    s3Url: `https://s3.amazonaws.com/${config.cohortBucket}/${id}.zip`,
                    zipPassword,
                });
            }
        });
    }),
};

module.exports = fileService;
