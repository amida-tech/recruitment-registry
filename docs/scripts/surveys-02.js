'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    return locals.agent
        .get('http://localhost:9005/api/v1.0/surveys/1')
        .then((res) => {
            console.log(res.status); // 200
            const survey = res.body;
            console.log(JSON.stringify(survey, undefined, 4));
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
