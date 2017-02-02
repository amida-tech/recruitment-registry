'use strict';

const _ = require('lodash');
const request = require('request');

const models = require('../models');
const shared = require('./shared.js');

const config = require('../config');


// IMPORT REQUESTS TO CALL CONSTANT CONTACT API

const CC_BASE_API_URL = "https://api.constantcontact.com/v2";
const emailUrl = CC_BASE_API_URL + "/contacts?action_by=ACTION_BY_VISITOR";
const apiKeyQueryParam = "&api_key=";


const newContactJSON = {
    "first_name": "Amida",
    "last_name": "Amida",
    "lists": [
        {
            "id": "1"
        }
    ],
    "email_addresses": [
        {
            "email_address": "kevin@amida-tech.com"
        }
    ]
};

function makeConstantContactOptions () {
    return {
        method: 'GET',
        url: CC_BASE_API_URL + "/contacts",
        headers: {
            "Authorization": "Bearer " + config.constantContact.token
        },
        qs: {
            api_key: config.constantContact.apiKey,
            email: email,
            access_token: "Bearer " + config.constantContact.token
        }
};


function sendCcEmail (email) {

    const firstCall = makeConstantContactOptions();


    // Hit up CC API to make sure user doesn't already exist
    request(
        // url,
        firstCall,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("GREAT SUCCESS");
                console.log(body);
            } else {
                console.log("FAIL");
                console.log(response.statusCode);
                console.log(response.statusMessage)
            }
        }
    );

};

exports.createNewUser = function (req, res) {
    
    // console.log("REGISTERING USER");
    // console.log(req.body);




    const newUser = Object.assign({ role: 'participant' }, req.body);
    return models.user.createUser(newUser)
        .then(({ id }) => res.status(201).json({ id }))
        .catch(shared.handleError(res));
};

exports.showCurrentUser = function (req, res) {
    const currentUser = _.omitBy(req.user, _.isNil);
    res.status(200).json(currentUser);
};

exports.updateCurrentUser = function (req, res) {
    models.user.updateUser(req.user.id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.resetPassword = function (req, res) {
    models.user.resetPassword(req.body.token, req.body.password)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};
