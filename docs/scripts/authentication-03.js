'use strict';

/* eslint no-param-reassign: 0, no-console: 0, import/no-extraneous-dependencies: 0 */

const request = require('superagent');

module.exports = function authentication03(locals) {
    console.log(`------ start ${module.filename}`);

    locals.agent = request.agent();
    return locals.agent
        .get('http://localhost:9005/api/v1.0/auth/basic')
        .auth('test2participant', 'test2password')
        .then((res) => {
            console.log(res.status); // 200
            console.log(res.header); // {... 'set-cookie': [ 'rr-jwt-token=eyJh ...}
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
