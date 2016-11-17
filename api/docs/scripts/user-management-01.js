'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const user = {
        username: 'test2participant',
        password: 'test2password',
        email: 'test2@example.com'
    };

    let jwtUser2 = null;
    return request
        .post('http://localhost:9005/api/v1.0/users')
        .set('Authorization', 'Bearer ' + jwt)
        .send(user)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body); // {token: ...}
            jwtUser2 = res.body.token;
        })
        .then(() => {
            locals.jwtUser2 = jwtUser2;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
