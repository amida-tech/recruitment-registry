'use strict';

const models = require('./models');

const surveyExamples = require('./test/fixtures/survey-examples');
const userExamples = require('./test/fixtures/user-examples');

const userExample = userExamples.Alzheimer;
const clientSurvey = surveyExamples.Alzheimer.survey;

const helper = require('./test/helper/survey-helper');

models.sequelize.sync({
    force: true
}).then(function () {
    return models.Registry.createProfileSurvey(clientSurvey);
}).then(function () {
    return models.Registry.getProfileSurvey();
}).then(function (survey) {
    const answers = helper.formAnswersToPost(survey, clientSurvey.answer);
    return models.Registry.createProfile({
        user: userExample,
        answers
    });
}).then(function () {
    console.log('success');
}).catch(function (err) {
    console.log('failure');
    console.log(err);
});
