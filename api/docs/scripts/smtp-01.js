'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const smtpSpec = {
        protocol: 'smtp',
        username: 'smtp@example.com',
        password: 'pw',
        host: 'localhost',
        from: 'admin@rr.com',
        otherOptions: {},
        subject: 'Registry Admin',
        content: 'Click on this: ${link}'
    };

    return request
        .post('http://localhost:9005/api/v1.0/smtp')
        .set('Authorization', 'Bearer ' + jwt)
        .send(smtpSpec)
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
