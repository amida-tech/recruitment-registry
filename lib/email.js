const request = require('request');

const config = require('../config');

const typeToAction = {
    'new_contact': sendCcEmail
};

function makeNewConstantContactOptions(email) {
    const CC_BASE_API_URL = 'https://api.constantcontact.com/v2';

    return {
        method: 'POST',
        url: CC_BASE_API_URL + '/contacts',
        headers: {
            'Authorization': 'Bearer ' + config.constantContact.token
        },
        qs: {
            api_key: config.constantContact.apiKey,
            access_token: 'Bearer ' + config.constantContact.token,
            action_by: 'ACTION_BY_VISITOR'
        },
        json: {
            'email_addresses': [{
                'email_address': email
            }],
            'lists': [{
                'id': config.constantContact.listId
            }]
        }
    };
}

function sendCcEmail(user) {
    const newContactRequest = makeNewConstantContactOptions(user.email);

    request(
        newContactRequest,
        () => {}
    );
}

module.exports = function sendMail(user, type, opts) {
    if (type in typeToAction) {
        typeToAction[type](user, opts);
    }
};
