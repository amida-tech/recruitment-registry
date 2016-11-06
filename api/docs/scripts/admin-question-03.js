'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const choiceQx = {
        type: 'choice',
        text: 'What is your hair color?',
        oneOfChoices: [
            'Black',
            'Brown',
            'Blonde',
            'Other'
        ]
    };

    let choiceQxId = null;
    return request
        .post('http://localhost:9005/api/v1.0/questions')
        .set('Authorization', 'Bearer ' + jwt)
        .send(choiceQx)
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the new question
            choiceQxId = res.body.id;
        })
        .then(() => {
            locals.choiceQx = choiceQx;
            locals.choiceQxId = choiceQxId;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
