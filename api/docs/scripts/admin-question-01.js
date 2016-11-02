const request = require('superagent');
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdXBlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTQ3Nzk2MTYxNSwiZXhwIjoxNDgwNTUzNjE1fQ.HJubwTIVEf7Z-83oUTWDVu0AEx-_8DZL46lmZo2WVTo';

let textQx = {
	type: 'text',
	text: 'Please describe reason for your enrollment?'
};

let textQxId = null;
request
	.post('http://localhost:9005/api/v1.0/questions')
	.set('Authorization', 'Bearer ' + jwt)
	.send(textQx)
	.end(function (err, res) {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of question
		textQxId = res.body.id;
	});
