'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const consentDocUpdate = {
        typeId: 2,
        content: 'This is an updated Consent Form.',
        updateComment: 'Updated notice added',
    };

    return locals.agent
        .post('http://localhost:9005/api/v1.0/consent-documents')
        .send(consentDocUpdate)
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the updated consent document
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
