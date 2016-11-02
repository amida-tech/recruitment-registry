'use strict';

const request = require('superagent');

module.exports = function(locals) {
	console.log(`------ start ${module.filename}`);

	let jwt = null;
	return request
	    .get('http://localhost:9005/api/v1.0/auth/basic')
	    .auth('super', 'Am!d@2017PW')
	    .then(res => {
	    	console.log(res.status); // 200
	    	console.log(res.body);   // {token: ...}
	    	jwt = res.body.token;
	    })
	    .then(() => {
	    	locals.jwt = jwt;
			console.log(`------ end ${module.filename}`);
	    	return locals;
		});
};
