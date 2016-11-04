'use strict';

const request = require('superagent');

module.exports = function(locals) {
	console.log(`------ start ${module.filename}`);
	const jwtUser = locals.jwtUser;

	return request
    	.post('http://localhost:9005/api/v1.0/consent-signatures')
    	.set('Authorization', 'Bearer ' + jwtUser)
    	.send( {consentDocumentId : 2} )
    	.then(res => {
    	    console.log(res.status);  // 201
    	    console.log(res.body.id); // id of the signature
    	})
		.then(() => {
			console.log(`------ end ${module.filename}`);
	    	return locals;
	    });
};
