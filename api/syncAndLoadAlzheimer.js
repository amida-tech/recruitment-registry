'use strict';

const models = require('./models');

const surveyExamples = require('./test/fixtures/survey-examples');
const userExamples = require('./test/fixtures/user-examples');

const userExample = userExamples.Alzheimer;
const surveyExample = surveyExamples.Alzheimer;
const answersSpec = surveyExamples.AlzheimerSpec;

const helper = require('./test/survey/survey-helper');

models.sequelize.sync({
    force: true
}).then(function () {
    return models.Survey.createSurvey(surveyExamples.Alzheimer);
}).then(function () {
    return models.Survey.getSurveyByName('Alzheimer');
}).then(function (survey) {
    const answers = helper.formAnswersToPost(survey, answersSpec);
    return models.User.register({
        user: userExample,
        surveyId: survey.id,
        answers
    });
}).then(function () {
    console.log('success');
}).catch(function (err) {
    console.log('failure');
    console.log(err);
});
