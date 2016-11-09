'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    return request
        .get('http://localhost:9005/api/v1.0/consents/name/primary-consent/documents')
        .then(res => {
            console.log(res.status); // 200
            console.log(JSON.stringify(res.body, undefined, 4)); // consent with documents
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
