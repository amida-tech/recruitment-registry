'use strict';


module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const languageUpdate = {
        name: 'Castilian Spanish',
        nativeName: 'Castillan'
    };

    return locals.agent
        .patch('http://localhost:9005/api/v1.0/languages/es')
        .send(languageUpdate)
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
