'use strict';

const models = require('./models');

const consentSeed = require('./test/util/consent-seed');
const consentExample = require('./test/fixtures/example/consent-demo');

const survey = {
    name: 'Alzheimer',
    questions: [{
        text: 'Zip Code',
        required: false,
        type: 'text'
    }, {
        text: 'Date of Birth',
        required: true,
        type: 'date',
    }, {
        text: 'Sex',
        required: true,
        type: 'choice',
        oneOfChoices: ['Male', 'Female', 'Other']
    }, {
        text: 'Ethnicity',
        required: true,
        type: 'choice',
        oneOfChoices: [
            'American Indian / Alaskan Native',
            'Asian / Pacific Islander',
            'Black / African',
            'Hispanic / Latino',
            'White / Caucasian',
            'Other'
        ]
    }, {
        text: 'Do you have a family history of memory disorders/Alzheimer\'s Disease/dementia?',
        required: true,
        type: 'choice',
        oneOfChoices: [
            'Yes',
            'No',
            'I\'m not sure'
        ]
    }, {
        text: 'Are you interested in volunteering in clinical research?',
        required: false,
        type: 'bool'
    }, {
        text: 'Are you interested in receiving info on:',
        required: true,
        type: 'choices',
        choices: [
            { text: 'Brain Health' },
            { text: 'Clinical Trials' }
        ]
    }, {
        text: 'How did you hear about us?',
        required: false,
        type: 'choices',
        choices: [
            { text: 'TV' },
            { text: 'Radio' },
            { text: 'Newspaper' },
            { text: 'Facebook/Google Ad/Other internet ad' },
            { text: 'Physician/nurse/healthcare professional' },
            { text: 'Caregiver' },
            { text: 'Friend/Family member' },
            { text: 'Community Event' },
            { text: 'Please specify', type: 'text' }
        ]
    }]
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
