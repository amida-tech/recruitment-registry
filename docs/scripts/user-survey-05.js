'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwtUser2 = locals.jwtUser2;

    return locals.agent
        .get('http://localhost:9005/api/v1.0/user-surveys/1')
        .set('Authorization', `Bearer ${jwtUser2}`)
        .then((res) => {
            console.log(res.status); // 200
            console.log(JSON.stringify(res.body, undefined, 4)); // answers with status
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
