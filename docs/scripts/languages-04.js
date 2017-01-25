'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const languageUpdate = {
        name: 'Castilian Spanish',
        nativeName: 'Castillan'
    };

    return request
        .patch('http://localhost:9005/api/v1.0/languages/es')
        .set('Authorization', 'Bearer ' + jwt)
        .send(languageUpdate)
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
