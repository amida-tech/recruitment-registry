'use strict';

const request = require('request');

const ccConfig = require('../config').constantContact;
const logger = require('../logger');

const typeToAction = {
    new_contact: sendCcEmail,
};

function makeNewConstantContactOptions(email) {
    return {
        method: 'POST',
        url: `${ccConfig.baseApiUrl}/contacts`,
        headers: {
            Authorization: `Bearer ${ccConfig.token}`,
        },
        qs: {
            api_key: ccConfig.apiKey,
            action_by: 'ACTION_BY_VISITOR',
        },
        json: {
            email_addresses: [{
                email_address: email,
            }],
            lists: [{
                id: ccConfig.listId,
            }],
        },
    };
}

function ensureConstantContactConfig() {
    const required = ['apiKey', 'token', 'baseApiUrl'];

    let allConfigPresent = true;

    required.forEach((e) => {
        if (ccConfig[e] === undefined) {
            allConfigPresent = false;
        }
    });

    return allConfigPresent;
}

function sendCcEmailResponseHandler(error, response) {
    if (error || (parseInt(response.statusCode, 10) !== 201)) {
        if (!error) {
            error = 'Sending email has failed.'; // TODO put correct error message based on Constant Contact doc here.
        }
        logger.log('error', error);
    }
}

function sendCcEmail(user) {
    const allConfigPresent = ensureConstantContactConfig();
    if (!allConfigPresent) {
        return;
    }

    const newContactRequest = makeNewConstantContactOptions(user.email);

    request(newContactRequest, sendCcEmailResponseHandler);
}

module.exports = function sendMail(user, type, opts) {
    if (type in typeToAction) {
        typeToAction[type](user, opts);
    }
};
