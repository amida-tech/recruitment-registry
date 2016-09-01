'use strict';

const db = require('./db');

db.sequelize.sync({
	force: true
}).then(function() {
	db.Survey.post({
		name: 'Alzheimer',
		questions: [{
			text: 'Family history of memory disorders/AD/dementia?',
			type: 'yes-no'
		}, {
			text: 'How did you hear about us?',
			type: 'multi-choice-multi',
			choices: [
				'TV',
				'Radio',
				'Newspaper',
				'Facebook/Google Ad/OtherInternet ad',
				'Physician/nurse/healthcare professional',
				'Caregiver',
				'Friend/Family member',
				'Community Event',
			],
		}, {
			text: 'Are you interested in receiving more information?',
			type: 'multi-choice-multi',
			choices: [
				'Brain Health',
				'Clinical Trials on Brain Health'
			],
		}, {
			text: 'Are you interested in volunterring in clinical research?',
			type: 'yes-no'
		}]
	});
}).then(function() {
	console.log('success');
}).catch(function(err) {
	console.log('failure');
	console.log(err);
});
