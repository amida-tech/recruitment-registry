'use strict';

const models = require('./models');

const registryExamples = require('./test/fixtures/registry-examples');
const surveyExamples = require('./test/fixtures/survey-examples');
const userExamples = require('./test/fixtures/user-examples');

const userExample = userExamples.Alzheimer;

const helper = require('./test/helper/survey-helper');

models.sequelize.sync({
    force: true
}).then(function () {
    return models.Registry.createRegistry(registryExamples[0]);
}).then(function () {
    return models.Registry.getRegistryProfileSurvey('Alzheimer');
}).then(function (survey) {
    const answers = helper.formAnswersToPost(survey, surveyExamples.Alzheimer.answer);
    return models.Registry.createProfile({
        user: userExample,
        registryName: registryExamples[0].name,
        answers
    });
}).then(function () {
    console.log('success');
}).catch(function (err) {
    console.log('failure');
    console.log(err);
});
