'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const consentTypeTOU = {
        name: 'terms-of-use',
        title: 'Terms of Use',
        type: 'single',
    };

    let consentTypeTOUId = null;
    return locals.agent
        .post('http://localhost:9005/api/v1.0/consent-types')
        .send(consentTypeTOU)
        .then((res) => {
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
