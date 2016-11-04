'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const textQx = {
        type: 'text',
        text: 'Please describe reason for your enrollment?'
    };

    let textQxId = null;
    return request
        .post('http://localhost:9005/api/v1.0/questions')
        .set('Authorization', 'Bearer ' + jwt)
        .send(textQx)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body.id); // Expected to be internal id of question
            textQxId = res.body.id;
        })
        .then(() => {
            locals.textQx = textQx;
            locals.textQxId = textQxId;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
