'use strict';

const request = require('superagent');

module.exports = function(locals) {
	console.log(`------ start ${module.filename}`);
	const jwt = locals.jwt;

	const boolQx = {
		type: 'bool',
		text: 'Do you own a pet?'
	};

	let boolQxId = null;
	return request
		.post('http://localhost:9005/api/v1.0/questions')
		.set('Authorization', 'Bearer ' + jwt)
		.send(boolQx)
		.then(res => {
			console.log(res.status);  // 201
			console.log(res.body.id); // Expected to be internal id of question
			boolQxId = res.body.id;
		})
	    .then(() => {
	    	locals.boolQx = boolQx;
	    	locals.boolQxId = boolQxId;
			console.log(`------ end ${module.filename}`);
	    	return locals;
	    });
};
