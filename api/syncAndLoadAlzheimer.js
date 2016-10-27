'use strict';

const models = require('./models');

const surveyExamples = require('./test/fixtures/example/survey');
const userExamples = require('./test/fixtures/example/user');
const consentSeed = require('./test/util/consent-seed');
const consentExample = require('./test/fixtures/example/consent-demo');

const userExample = userExamples.Alzheimer;
const sample = surveyExamples.Alzheimer;

const helper = require('./test/util/survey-common');

models.sequelize.sync({
    force: true
}).then(function () {
    return models.Registry.createProfileSurvey(sample.survey);
}).then(function () {
    return models.Registry.getProfileSurvey();
}).then(function (survey) {
    const answers = helper.formAnswersToPost(survey, sample.answer);
    return models.Registry.createProfile({
        user: userExample,
        answers
    });
}).then(function () {
    return models.Survey.createSurvey(surveyExamples.Example.survey);
}).then(function() {
    return consentSeed(consentExample);
}).then(function () {
    console.log('success');
}).catch(function (err) {
    console.log('failure');
    console.log(err);
});
