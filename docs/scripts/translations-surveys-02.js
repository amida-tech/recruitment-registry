'use strict';

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    return locals.agent
        .get('http://localhost:9005/api/v1.0/surveys/1')
        .query({ language: 'tr' })
        .then((res) => {
            console.log(res.status); // 200
            console.log(JSON.stringify(res.body, undefined, 4)); // Turkish version of the survey
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
