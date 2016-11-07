'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    return request
        .get(`http://localhost:9005/api/v1.0/consent-types/2`)
        .set('Authorization', 'Bearer ' + jwt)
        .query({ language: 'tr' })
        .then(res => {
            console.log(res.status); // 200
            console.log(JSON.stringify(res.body, undefined, 4)); // Turkish version of the consent type
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
