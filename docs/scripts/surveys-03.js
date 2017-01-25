'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwtUser = locals.jwtUser;

    const answers = [{
        questionId: 1,
        answer: { textValue: 'Try new medicine' }
    }, {
        questionId: 2,
        answer: { boolValue: false }
    }, {
        questionId: 5,
        answer: { choice: 4 }
    }, {
        questionId: 4,
        answer: {
            choices: [{
                id: 5,
                boolValue: true
            }, {
                id: 7
            }, {
                id: 8,
                textValue: 'Soccer'
            }]
        }
    }];

    return request
        .post('http://localhost:9005/api/v1.0/answers')
        .set('Authorization', 'Bearer ' + jwtUser)
        .send({ surveyId: 1, answers })
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
