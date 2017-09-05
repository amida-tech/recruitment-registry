'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    let choicesQx = {
        type: 'choices',
        text: 'What kind of exercises do you do?',
        choices: [
            { text: 'Walking' },
            { text: 'Jogging', type: 'bool' },
            { text: 'Cycling', type: 'bool' },
            { text: 'Please specify other', type: 'text' },
        ],
    };

    choicesQx = {
        type: 'choices',
        text: 'What kind of exercises do you do?',
        choices: [
            { text: 'Walking' },
            { text: 'Jogging', type: 'bool' },
            { text: 'Cycling', type: 'bool' },
            { text: 'Please specify other', type: 'text' },
        ],
    };

    let choicesQxId = null;
    return locals.agent
        .post('http://localhost:9005/api/v1.0/questions')
        .send(choicesQx)
        .then((res) => {
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
