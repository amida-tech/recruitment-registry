'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    return request
        .get('http://localhost:9005/api/v1.0/questions')
        .set('Authorization', 'Bearer ' + jwt)
        .then(res => {
            console.log(res.status);  // 200
            const questionList = res.body;
            console.log(JSON.stringify(questionList, undefined, 4));
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
