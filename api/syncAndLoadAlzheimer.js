'use strict';

const db = require('./db');

const surveyExamples = require('../fixtures/survey-examples');

db.sequelize.sync({
	force: true
}).then(function() {
	db.Survey.post(surveyExamples.Alzheimer);
}).then(function() {
	console.log('success');
}).catch(function(err) {
	console.log('failure');
	console.log(err);
});
