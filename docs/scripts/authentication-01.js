'use strict';

/* eslint no-console: 0, no-param-reassign: 0, import/no-extraneous-dependencies: 0 */

const request = require('superagent');

module.exports = function authentication01(locals) {
    console.log(`------ start ${module.filename}`);

    locals.agent = request.agent();
    return locals.agent
        .get('http://localhost:9005/api/v1.0/auth/basic')
        .auth('super', 'Am!d@2017PW')
        .then((res) => {
            console.log(res.status); // 200
            const cookie = res.header['set-cookie'][0];
            const jwt = cookie.split(';')[0].split('=')[1];
            console.log(jwt);
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
