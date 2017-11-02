'use strict';

const fileService = require('./file-service');
const RRError = require('./rr-error');

const uploadCohortCSV = csv => fileService.zipAndUploadCsv(csv).catch((err) => {
    console.log('error from zipAndUploadCsv');
    throw new RRError('cohortS3NoZipUpload', err.code);
});

module.exports = {
    uploadCohortCSV,
};
