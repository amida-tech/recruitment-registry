'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const consentTypeConsentTurkish = {
        id: 2,
        title: 'İzin Metni'
    };

    return request
        .patch('http://localhost:9005/api/v1.0/consent-types/text/tr')
        .set('Authorization', 'Bearer ' + jwt)
        .send(consentTypeConsentTurkish)
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
