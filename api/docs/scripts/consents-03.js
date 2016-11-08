'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    return request
        .get('http://localhost:9005/api/v1.0/consents/1')
        .set('Authorization', 'Bearer ' + jwt)
        .then(res => {
            console.log(res.status); // 200
            console.log(JSON.stringify(res.body, undefined, 4)); // consent details
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
