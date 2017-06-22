'use strict';

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;


const request = require('request');


// const awsConfig = require('./config').awsApi;


const RRError = require('./rr-error');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});


// limited to alphanumeric
const makeRandomString = function(length) {
    let text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};





function csvStringToFile(csvString) {
    return new Promise((resolve, reject) => {
        const id = makeRandomString(32);
        const name = `cohort_${id}`;
        const newFilePath = path.resolve(__dirname, `../tmp/${id}.csv`);

        fs.writeFile(newFilePath, csvString, function (err){
            if (err){ return reject(err); }
            return resolve({
                id: id,
                newCsvPath: newFilePath,
            });
        });
    });
};


function uploadToS3(data){
    return new Promise((resolve, reject) => {

        const body = fs.readFileSync(data.zipPath);
        const key = 'cohorts/' + data.id;

        const params = {
            Bucket: "recreg-dev-cohorts",
            Key: key,
            // Body: fs.createReadStream(csv),
            // Body: csv,
            Body: body,
            ACL: 'public-read',
            ContentType: 'application/zip',
        };

        s3.putObject(params, function(err, data) {
            if (err) { return reject(err) }
            return resolve(data);
        });
    })
}


function makeJSONResponse(data){

    console.log("Promises work");
    console.dir(data);
    console.log("-------");
    return {"this": "works"};
}

function zipCSV(data){

    console.log ("ZIP CSV");
    return new Promise((resolve, reject) => {
        const zipPath = data.newCsvPath.replace(".csv", ".zip");
        const zipPassword = makeRandomString(16);
        const zip = spawn('zip', ['-P', zipPassword, zipPath, data.newCsvPath]);
        // TODO: handle error here better
        zip.on('exit', function(code){
            return resolve({
                code: code,
                id: data.id,
                zipPath: zipPath,
                zipPassword: zipPassword
            })
        })
    })
};


const uploadCohortCSV = function zipAndUploadToS3(csv){

    console.log("upload starting");

    return csvStringToFile(csv)
        .then(zipCSV)
        .then(uploadToS3, err => RRError.reject('S3 Upload error', err.code))
        .then(makeJSONResponse, err => RRError.reject('S3 Upload error', err.code));


    // zipCSV(newFilePath);

    // const fileSuccessfullyUploaded = csvStringToFile(csv);


};



module.exports = {
    uploadCohortCSV: uploadCohortCSV,
};


