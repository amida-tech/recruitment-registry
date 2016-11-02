'use strict';

const request = require('superagent');

module.exports = function(locals) {
	console.log(`------ start ${module.filename}`);
	const jwt = locals.jwt;

	const consentTypeConsent = {
	    name: 'consent',
	    title: 'Consent Form',
	    type: 'single'
	};

	let consentTypeConsentId = null;
	return request
		.post('http://localhost:9005/api/v1.0/consent-types')
		.set('Authorization', 'Bearer ' + jwt)
		.send(consentTypeConsent)
		.then(res => {
			console.log(res.status);  // 201
			console.log(res.body.id); // Expected to be internal id of the consent type
			consentTypeConsentId = res.body.id;
		})
	    .then(() => {
	    	locals.consentTypeConsentId = consentTypeConsentId;
			console.log(`------ end ${module.filename}`);
	    	return locals;
		});
};
