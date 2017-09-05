'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const answers = [{
        questionId: 1,
        answer: { textValue: 'Try new medicine' },
    }, {
        questionId: 2,
        answer: { boolValue: false },
    }, {
        questionId: 5,
        answer: { choice: 4 },
    }, {
        questionId: 4,
        answer: {
            choices: [{
                id: 5,
                boolValue: true,
            }, {
                id: 7,
            }, {
                id: 8,
                textValue: 'Soccer',
            }],
        },
    }];

    return locals.agent
        .post('http://localhost:9005/api/v1.0/answers')
        .send({ surveyId: 1, answers })
        .then((res) => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
