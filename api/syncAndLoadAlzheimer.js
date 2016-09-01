'use strict';

const db = require('./db');

db.sync({
	force: true
}).then(function() {
	db.Survey.post({
		name: 'Alzheimer',
		questions: [{
			text: 'Family history of memory disorders/AD/dementia?',
			type: 'yes-nos'
		}]
	});
});