'use strict';

const models = require('./models');

const surveyExamples = require('./test/fixtures/survey-examples');

models.sequelize.sync({
    force: true
}).then(function () {
    models.Survey.createSurvey(surveyExamples.Alzheimer);
}).then(function () {
    console.log('success');
}).catch(function (err) {
    console.log('failure');
    console.log(err);
});
