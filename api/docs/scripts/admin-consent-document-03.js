'use strict';

const request = require('superagent');

module.exports = function(locals) {
	console.log(`------ start ${module.filename}`);
	const jwt = locals.jwt;

	const consentTypeTOUId = locals.consentTypeTOUId;

	const consentDocTOU = {
		typeId: consentTypeTOUId,
		content: 'This is a terms of use document.'
	};

	return request
		.post('http://localhost:9005/api/v1.0/consent-documents')
		.set('Authorization', 'Bearer ' + jwt)
		.send(consentDocTOU)
		.then(res => {
			console.log(res.status);  // 201
			console.log(res.body.id); // Expected to be internal id of the consent document
		})
	    .then(() => {
			console.log(`------ end ${module.filename}`);
	    	return locals;
		});
};
