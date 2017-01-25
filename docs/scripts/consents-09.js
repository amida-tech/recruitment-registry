'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const consentDocUpdate = {
        typeId: 1,
        content: 'This is an updated Terms of Use.',
        updateComment: 'Updated TOU notice added'
    };

    return request
        .post('http://localhost:9005/api/v1.0/consent-documents')
        .set('Authorization', 'Bearer ' + jwt)
        .send(consentDocUpdate)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the updated consent document
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
