'use strict';

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

// const awsConfig = require('./config').awsApi;
const AWS = require('aws-sdk');
const RRError = require('./rr-error');
const utils = require('./utils');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// TODO: Move to config
const bucket = 'recreg-dev-cohorts';

const makeS3CohortURL = function (id) {
    return `https://s3.amazonaws.com/recreg-dev-cohorts/cohorts/${id}`;
};

function csvStringToFile(csvString) {
    return new Promise((resolve, reject) => {
        const id = utils.makeRandomString(32);
        const newFilePath = path.resolve(__dirname, `../tmp/${id}.csv`);
        fs.writeFile(newFilePath, csvString, (err) => {
            if (err) {
                return reject(err);
            }
            return resolve({
                id,
                path: newFilePath,
            });
        });
    });
}

// / :data: {id, path}
function zipCSV(meta) {
    return new Promise((resolve, reject) => {
        const zipPath = meta.path.replace('.csv', '.zip');
        const zipPassword = utils.makeRandomString(16);
        const zip = spawn('zip', ['-P', zipPassword, zipPath, meta.path]);
        // TODO: linux/osx only.  need to find a node package
        zip.on('exit', (code) => {
            if (code === 0) {
                resolve({
                    id: meta.id,
                    message: 'Cohort successfully uploaded.',
                    password: zipPassword,
                    path: zipPath,
                });
            } else {
                const err = new RRError('cohortZipFileNotGenerated');
                reject(err);
            }
        });
    });
}

// :zipData: {message, zipPassword}
function uploadToS3(zipData) {
    return new Promise((resolve, reject) => {
        const body = fs.readFileSync(zipData.path);
        const key = `cohorts/${zipData.id}`;

        const params = {
            Bucket: bucket,
            Key: key,
            Body: body,
            ACL: 'public-read',
            ContentType: 'application/zip',
        };

        s3.putObject(params, (err, data) => {
            if (err) {
                const rrErr = new RRError('cohortS3NoZipUpload', err.code);
                return reject(rrErr);
            }
            return resolve({
                s3Data: data,
                id: zipData.id,
                password: zipData.password,
            });
        });
    });
}

function makeResponse(data) {
    return {
        s3Url: makeS3CohortURL(data.id),
        zipPassword: data.password,
    };
}

// TODO: clear tmp folder
const uploadCohortCSV = function zipAndUploadToS3(csv) {
    return csvStringToFile(csv)
        .then(zipCSV)
        .then(uploadToS3)
        .then(makeResponse);
};

module.exports = {
    uploadCohortCSV,
};
