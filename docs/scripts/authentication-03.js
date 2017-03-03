'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    locals.agent = request.agent();
    return locals.agent
        .get('http://localhost:9005/api/v1.0/auth/basic')
        .auth('test2participant', 'test2password')
        .then(res => {
            console.log(res.status); // 200
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
