'use strict';

const request = require('superagent');

module.exports = function(locals) {
	console.log(`------ start ${module.filename}`);
	const jwtUser = locals.jwtUser;

	return request
		.get('http://localhost:9005/api/v1.0/consent-documents/type-name/consent/with-signature')
		.set('Authorization', 'Bearer ' + jwtUser)
		.then(res => {
			console.log(res.status);  // 200'
			console.log(JSON.stringify(res.body, undefined, 4)); // consent document with signature info
		})
		.then(() => {
			console.log(`------ end ${module.filename}`);
	    	return locals;
	    });
};
