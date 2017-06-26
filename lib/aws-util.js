'use strict';

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

const request = require('request');
const nodemailer = require('nodemailer');

// const awsConfig = require('./config').awsApi;
const AWS = require('aws-sdk');
const RRError = require('./rr-error');

function sendEmail(){

    let smtpConfig = {
        // host: ,
        // port: 587,
        // secure: false,
        auth: {
            user: 'username',
            pass: 'password'
        },
        protocol: 'smtp',
    };

    let data = {
        subject: 'hello',
        text: 'world',
    };

    let mailerOptions = {
        to : 'kevin@amida.com',
        subject : data.subject,
        text : data.text,
    };

    const transporter = nodemailer.createTransport(smtpConfig);

    transporter.sendMail(mailerOptions, (err) => {
        if (err) {
            console.log("ERROR: ", err);
            return;
        }
        console.log("Check mail");
    });
}



const s3 = new AWS.S3({apiVersion: '2006-03-01'});


// limited to alphanumeric
const makeRandomString = function(length) {
    let text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

const makeS3CohortURL = function(id){
    return `https://s3.amazonaws.com/recreg-dev-cohorts/cohorts/${id}`;
};


function csvStringToFile(csvString) {
    return new Promise((resolve, reject) => {
        const id = makeRandomString(32);
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



// :zipData: {message, zipPassword}
function uploadToS3(zipData){
    return new Promise((resolve, reject) => {
        const body = fs.readFileSync(zipData.zipPath);
        const key = 'cohorts/' + zipData.id;

        const params = {
            Bucket: "recreg-dev-cohorts",
            Key: key,
            Body: body,
            ACL: 'public-read',
            ContentType: 'application/zip',
        };

        s3.putObject(params, function(err, data) {
            if (err) { return reject(err) }
            return resolve({
                s3Data: data,
                id: zipData.id,
                zipPassword: zipData.zipPassword,
            });
        });
    })
}


function makeJSONResponse(data){

    sendEmail();
    
    return {
        s3Url: makeS3CohortURL(data.id),
        zipPassword: data.zipPassword,
    }
}

/// :data: {id, filepath}
function zipCSV(data){
    return new Promise((resolve, reject) => {
        const zipPath = data.newCsvPath.replace(".csv", ".zip");
        const zipPassword = makeRandomString(16);
        const zip = spawn('zip', ['-P', zipPassword, zipPath, data.newCsvPath]);
        // TODO: handle error here better
        zip.on('exit', function(code){
            return resolve({
                id: data.id,
                message: "Cohort successfully uploaded.",
                zipPassword: zipPassword,
                zipPath: zipPath,
            })
        })
    })
};


const uploadCohortCSV = function zipAndUploadToS3(csv){
    return csvStringToFile(csv)
        .then(zipCSV)
        .then(uploadToS3, err => RRError.reject('S3 Upload error', err.code))
        .then(makeJSONResponse, err => RRError.reject('S3 Upload error', err.code));
};



module.exports = {
    uploadCohortCSV: uploadCohortCSV,
};


