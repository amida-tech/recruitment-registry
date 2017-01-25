'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const consentDocTurkish = {
        id: 3,
        content: 'Bu güncelleştirilmiş bir izin metnidir.',
        updateComment: 'Güncelleştirilmiş ibaresi eklendi'
    };

    return request
        .patch('http://localhost:9005/api/v1.0/consent-documents/text/tr')
        .set('Authorization', 'Bearer ' + jwt)
        .send(consentDocTurkish)
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
