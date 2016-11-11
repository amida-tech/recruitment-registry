'use strict';

const request = require('superagent');

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);
    const jwt = locals.jwt;

    const choicesQxTurkish = {
        'id': 4,
        'text': 'Hangi eksersizleri yapıyorsunuz?',
        'actions': [{
                'id': 1,
                'text': 'Kabul Et'
            },
            {
                'id': 2,
                'text': 'Eksersiz yapmıyorum.'
            }
        ],
        'choices': [{
                'id': 5,
                'text': 'Yürüyüş'
            },
            {
                'id': 6,
                'text': 'Yavaş Koşu'
            },
            {
                'id': 7,
                'text': 'Koşu'
            },
            {
                'id': 8,
                'text': 'Lütfen başka bir eksersiz belirtiniz.'
            }
        ]
    };

    return request
        .patch('http://localhost:9005/api/v1.0/questions/text/tr')
        .set('Authorization', 'Bearer ' + jwt)
        .send(choicesQxTurkish)
        .then(res => {
            console.log(res.status); // 204
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
