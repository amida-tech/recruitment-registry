'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    return locals.agent
        .post('http://localhost:9005/api/v1.0/profile-survey-id')
        .send({ profileSurveyId: 1 })
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body); // id of the survey
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
