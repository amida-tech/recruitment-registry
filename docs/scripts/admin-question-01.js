'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const textQx = {
        type: 'text',
        text: 'Please describe reason for your enrollment?',
    };

    let textQxId = null;
    return locals.agent
        .post('http://localhost:9005/api/v1.0/questions')
        .send(textQx)
        .then((res) => {
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
