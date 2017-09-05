'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const consentTypeConsentId = locals.consentTypeConsentId;

    const consentDocConsent = {
        typeId: consentTypeConsentId,
        content: 'This is consent form.',
    };

    return locals.agent
        .post('http://localhost:9005/api/v1.0/consent-documents')
        .send(consentDocConsent)
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the new consent document
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
