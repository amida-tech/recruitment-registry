'use strict';

const request = require('request');

const ccConfig = require('../config').constantContact;
const logger = require('../logger');

function makeNewConstantContactOptions(email) {
    return {
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
        // TODO put correct Constant Contact error message
        const msg = error || 'Sending email has failed.';
        logger.log('error', msg);
    }
}

function sendCcEmail(user) {
    const allConfigPresent = ensureConstantContactConfig();
    if (!allConfigPresent) {
        return;
    }

    const newContactRequest = makeNewConstantContactOptions(user.email);
    request.post(newContactRequest, sendCcEmailResponseHandler);
}

const typeToAction = {
    new_contact: sendCcEmail,
};

module.exports = function sendMail(user, type, opts) {
    if (type in typeToAction) {
        typeToAction[type](user, opts);
    }
};
