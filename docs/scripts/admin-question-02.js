'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const boolQx = {
        type: 'bool',
        text: 'Do you own a pet?',
    };

    let boolQxId = null;
    return locals.agent
        .post('http://localhost:9005/api/v1.0/questions')
        .send(boolQx)
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body.id); // Expected to be internal id of question
            boolQxId = res.body.id;
        })
        .then(() => {
            locals.boolQx = boolQx;
            locals.boolQxId = boolQxId;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
