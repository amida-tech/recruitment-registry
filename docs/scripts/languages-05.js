'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    return request
        .delete('http://localhost:9005/api/v1.0/languages/fr')
        .set('Authorization', 'Bearer ' + jwt)
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
