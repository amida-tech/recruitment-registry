'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const consent = {
        name: 'primary-consent',
        sections: [1, 2]
    };

    return request
        .post('http://localhost:9005/api/v1.0/consents')
        .set('Authorization', 'Bearer ' + jwt)
        .send(consent)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the new consent
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
