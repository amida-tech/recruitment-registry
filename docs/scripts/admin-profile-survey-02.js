'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    return locals.agent
        .get('http://localhost:9005/api/v1.0/profile-survey-id')
        .then((res) => {
            console.log(res.status); // 200
            console.log(res.body); // id of the profile survey
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
