'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const newLanguage = {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe'
    };

    return request
        .post('http://localhost:9005/api/v1.0/languages')
        .set('Authorization', 'Bearer ' + jwt)
        .send(newLanguage)
        .then(res => {
            console.log(res.status); // 202
            console.log(res.body); // code of the new language
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
