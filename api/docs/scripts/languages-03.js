'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwtUser = locals.jwt;

    return request
        .get('http://localhost:9005/api/v1.0/languages/es')
        .set('Authorization', 'Bearer ' + jwtUser)
        .then(res => {
            console.log(res.status); // 200
            console.log(res.body); // definition of spanish
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
