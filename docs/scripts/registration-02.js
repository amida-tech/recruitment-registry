'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    let touDocument;
    return locals.agent
        .get('http://localhost:9005/api/v1.0/consent-documents/type/1')
        .then((res) => {
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
