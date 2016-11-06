'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const choicesQx = {
        type: 'choices',
        text: 'What kind of exercises do you do?',
        choices: [
            { text: 'Walking' },
            { text: 'Jogging', type: 'bool' },
            { text: 'Cycling', type: 'bool' },
            { text: 'Please specify other', type: 'text' }
        ],
    };

    let choicesQxId = null;
    return request
        .post('http://localhost:9005/api/v1.0/questions')
        .set('Authorization', 'Bearer ' + jwt)
        .send(choicesQx)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body.id); // Expected to be internal id of question
            choicesQxId = res.body.id;
        })
        .then(() => {
            locals.choicesQx = choicesQx;
            locals.choicesQxId = choicesQxId;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
