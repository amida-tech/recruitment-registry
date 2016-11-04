'use strict';

const request = require('superagent');

module.exports = function(locals) {
	console.log(`------ start ${module.filename}`);
	const jwtUser = locals.jwtUser;

	return request
		.get('http://localhost:9005/api/v1.0/surveys/1')
		.set('Authorization', 'Bearer ' + jwtUser)
		.then(res => {
			console.log(res.status);  // 200
			const survey = res.body;
			console.log(JSON.stringify(survey, undefined, 4));
		})
		.then(() => {
			console.log(`------ end ${module.filename}`);
	    	return locals;
	    });
};
