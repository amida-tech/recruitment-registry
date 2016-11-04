'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    let touDocument;
    return request
        .get('http://localhost:9005/api/v1.0/consent-documents/type-name/terms-of-use')
        .then(res => {
            console.log(res.status); // 200
            touDocument = res.body;
            console.log(JSON.stringify(touDocument, undefined, 4));
        })
        .then(() => {
            locals.touDocument = touDocument;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
