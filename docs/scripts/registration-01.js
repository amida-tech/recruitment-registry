'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    let profileSurvey;
    return locals.agent
        .get('http://localhost:9005/api/v1.0/profile-survey')
        .then((res) => {
            console.log(res.status); // 200
            profileSurvey = res.body;
            console.log(JSON.stringify(profileSurvey, undefined, 4));
        })
        .then(() => {
            locals.profileSurvey = profileSurvey;
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
