'use strict';

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const Minizip = require('minizip-asm.js');

const aws = require('./aws');
const RRError = require('./rr-error');
const utils = require('./utils');
const config = require('../config');

const makeS3CohortURL = function (id) {
    const bucket = config.cohortBucket;
    return `https://s3.amazonaws.com/${bucket}/cohorts/${id}`;
};

function csvStringToFile(csvString) {
    return new Promise((resolve, reject) => {
        const id = utils.makeRandomString(32);
        const newFilePath = path.resolve(config.tmpDirectory, `${id}.csv`);
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
        const mz = new Minizip();
        const content = new Buffer(fs.readFileSync(meta.path));
        const zipPath = meta.path.replace('.csv', '.zip');
        const zipPassword = utils.makeRandomString(16);
        const components = meta.path.split('/');
        mz.append(components[components.length - 1], content, { password: zipPassword });
        fs.writeFile(zipPath, new Buffer(mz.zip()), (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: meta.id,
                    message: 'Cohort successfully uploaded.',
                    password: zipPassword,
                    path: zipPath,
                });
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
            Bucket: config.cohortBucket,
            Key: key,
            Body: body,
            ACL: 'public-read',
            ContentType: 'application/zip',
        };

        aws.putObject(params, (err, data) => {
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
