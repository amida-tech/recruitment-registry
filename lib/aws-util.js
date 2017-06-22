'use strict';

const fs = require('fs');

const request = require('request');

// const awsConfig = require('./config').awsApi;


const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});






const zipAndUploadToS3 = function zipAndUploadToS3(csv){

    console.log(typeof csv);

    const params = {
        Bucket: "recreg-dev-cohorts",
        Key: 'cohorts/trialAndError',
        // Body: fs.createReadStream(csv),
        Body: csv,
        ACL: 'public-read',
        ContentType: 'text/csv',
    };

    s3.putObject(params, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log("Successfully uploaded data to myBucket/myKey");
        }
    });
};



module.exports = {
    zipAndUploadToS3: zipAndUploadToS3,
};


