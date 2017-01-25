'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const consentTypeConsentId = locals.consentTypeConsentId;

    const consentDocConsent = {
        typeId: consentTypeConsentId,
        content: 'This is consent form.'
    };

    return request
        .post('http://localhost:9005/api/v1.0/consent-documents')
        .set('Authorization', 'Bearer ' + jwt)
        .send(consentDocConsent)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the new consent document
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
