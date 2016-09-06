'use strict';

const models = require('./models');

const surveyExamples = require('../fixtures/survey-examples');

models.sequelize.sync({
    force: true
}).then(function () {
    models.Survey.post(surveyExamples.Alzheimer);
}).then(function () {
    console.log('success');
}).catch(function (err) {
    console.log('failure');
    console.log(err);
});
