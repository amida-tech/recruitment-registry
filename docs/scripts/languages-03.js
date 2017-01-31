'use strict';


module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwtUser = locals.jwt;

    return locals.agent
        .get('http://localhost:9005/api/v1.0/languages/es')
        .then(res => {
            console.log(res.status); // 200
            console.log(res.body); // definition of spanish
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
