'use strict';

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const consentTypeConsent = {
        name: 'consent',
        title: 'Consent Form',
        type: 'single',
    };

    let consentTypeConsentId = null;
    return locals.agent
        .post('http://localhost:9005/api/v1.0/consent-types')
        .send(consentTypeConsent)
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the new consent type
            consentTypeConsentId = res.body.id;
        })
        .then(() => {
            locals.consentTypeConsentId = consentTypeConsentId;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
