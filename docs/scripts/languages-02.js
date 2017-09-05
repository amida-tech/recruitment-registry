'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const newLanguage = {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe',
    };

    return locals.agent
        .post('http://localhost:9005/api/v1.0/languages')
        .send(newLanguage)
        .then((res) => {
            console.log(res.status); // 202
            console.log(res.body); // code of the new language
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
