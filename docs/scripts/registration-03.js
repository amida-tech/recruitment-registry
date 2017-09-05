'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const user = {
        username: 'testparticipant',
        password: 'testpassword',
        email: 'test@example.com',
    };

    const answers = [{
        questionId: 6,
        answer: { choice: 13 },
    }, {
        questionId: 7,
        answer: { textValue: '20850' },
    }, {
        questionId: 8,
        answer: { boolValue: true },
    }, {
        questionId: 9,
        answer: {
            choices: [{
                id: 16,
                boolValue: true,
            }, {
                id: 17,
            }, {
                id: 23,
                textValue: 'Community event',
            }],
        },
    }];

    const signatures = [1];

    const registration = { user, answers, signatures };

    let jwtUser = null;
    return locals.agent
        .post('http://localhost:9005/api/v1.0/profiles')
        .send(registration)
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body); // {token: ...}
            jwtUser = res.body.token;
        })
        .then(() => {
            locals.user = user;
            locals.jwtUser = jwtUser;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
