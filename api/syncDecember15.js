'use strict';

const models = require('./models');

const consentSeed = require('./test/util/consent-seed');
const consentExample = require('./test/fixtures/example/consent-demo');

const survey = {
    name: 'Alzheimer',
    questions: [{
            text: 'First Name',
            required: true,
            type: 'text'
        }, {
            text: 'Last Name',
            required: true,
            type: 'text'
        },
        {
            text: 'Zip Code',
            required: true,
            type: 'zip'
        }, {
            text: 'Year of Birth',
            required: true,
            type: 'year',
        }
    ]
};

models.sequelize.sync({
    force: true
}).then(function () {
    return models.survey.createSurvey(survey);
}).then(function () {
    return consentSeed(consentExample);
}).then(function () {
    console.log('success');
}).catch(function (err) {
    console.log('failure');
    console.log(err);
});
