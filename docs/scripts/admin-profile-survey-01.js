'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    return request
        .post('http://localhost:9005/api/v1.0/profile-survey-id')
        .set('Authorization', 'Bearer ' + jwt)
        .send({ profileSurveyId: 1 })
        .then(res => {
            console.log(res.status); // 201
            console.log(res.body); // id of the survey
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
