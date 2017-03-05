'use strict';

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const surveyTurkish = {
        id: 1,
        name: 'Örnek',
        sections: [{
            id: 1,
            name: 'Kişisel Bilgiler',
        }, {
            id: 2,
            name: 'Sağlık',
        }],
    };

    return locals.agent
        .patch('http://localhost:9005/api/v1.0/surveys/text/tr')
        .send(surveyTurkish)
        .then((res) => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
