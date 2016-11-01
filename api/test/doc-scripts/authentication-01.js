const request = require('superagent');

request
    .get('http://localhost:9005/api/v1.0/auth/basic')
    .auth('super', 'Am!d@2017PW')
    .end(function (err, res) {
    	console.log(res.status); // 200
    	console.log(res.body);   // {token: ...}
    });
