'use strict';

const models = require('./models');

const consentSeed = require('./test/util/consent-seed');
const consentExample = require('./test/fixtures/example/consent-demo');

const survey = {
    name: 'Alzheimer',
    questions: [{
        text: 'First Name',
        required: true,
        type: 'text',
    }, {
        text: 'Last Name',
        required: true,
        type: 'text',
    },
    {
        text: 'Zip Code',
        required: true,
        type: 'zip',
    }, {
        text: 'Year of Birth',
        required: true,
        type: 'year',
    },
    ],
};

models.sequelize.query('SELECT COUNT(*) AS count FROM information_schema.tables WHERE  table_schema = \'public\' AND table_name = \'registry_user\'', { type: models.sequelize.QueryTypes.SELECT })
    .then((result) => {
        if (result[0].count === '0') {
            return models.sequelize.sync({ force: true })
                .then(() => models.profileSurvey.createProfileSurvey(survey))
                .then(() => consentSeed(consentExample))
                .then(() => console.log('success'));
        }
        console.log('already initialized');
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.log('failure');
        console.log(err);
        process.exit(1);
    });
