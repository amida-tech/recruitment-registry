'use strict';

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    let consentDocUpdate = {
        typeId: 2,
        content: 'This is an updated Consent Form.',
        updateComment: 'Updated notice added'
    };

    return locals.agent
        .post('http://localhost:9005/api/v1.0/consent-documents')
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
