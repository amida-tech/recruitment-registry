'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const consentTypeTOU = {
        name: 'terms-of-use',
        title: 'Terms of Use',
        type: 'single'
    };

    let consentTypeTOUId = null;
    return request
        .post('http://localhost:9005/api/v1.0/consent-types')
        .set('Authorization', 'Bearer ' + jwt)
        .send(consentTypeTOU)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body.id); // internal id of the new consent type
            consentTypeTOUId = res.body.id;
        })
        .then(() => {
            locals.consentTypeTOUId = consentTypeTOUId;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
