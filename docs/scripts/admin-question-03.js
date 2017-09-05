'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const choiceQx = {
        type: 'choice',
        text: 'What is your hair color?',
        oneOfChoices: [
            'Black',
            'Brown',
            'Blonde',
            'Other',
        ],
    };

    let choiceQxId = null;
    return locals.agent
        .post('http://localhost:9005/api/v1.0/questions')
        .send(choiceQx)
        .then((res) => {
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
