## Integration Document

### Introduction

All node.js code snippets in the document use [superagent](https://github.com/visionmedia/superagent).  This package can be installed by `npm`
```
$ npm install superagent
```

Package needs to be required before running the snippets
```js
const request = require('superagent');
```

### Authentication
<a name="authentication"/>

This API uses Basic Authentication where username and password are passed to path `/auth/basic` in the HTTP Authorization header as `Basic code` where code is base64 encoded string for `username:password`.  Most HTTP clients provide a specific option for this authentication including superagent

```js
let jwt;
request
    .get('http://localhost:9005/api/v1.0/auth/basic')
    .auth('super', 'Am!d@2017PW')
    .end(function (err, res) {
    	console.log(res.status); // 200
    	console.log(res.body);   // {token: ...}
    	jwt = res.body.token;
    });
```
or curl

```
$ curl --user 'super:Am!d@2017PW' http://localhost:9005/api/v1.0/auth/basic`
```

If succesful this authentication will return HTTP status 200 (OK) and will return a [JSON Web Token](https://jwt.io/) (JWT) in the body

```js
{
	"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdXBlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTQ3Nzk2MTYxNSwiZXhwIjoxNDgwNTUzNjE1fQ.HJubwTIVEf7Z-83oUTWDVu0AEx-_8DZL46lmZo2WVTo"
}
```

JWT needs to be stored on the client and is to be used in other API calls for [authorization](#authorization). If authentication fails HTTP status will be 401 (Unauthorized).

### Authorization
<a name="authorization"/>

For all API calls that require authorization the JSON Web Token that is obtained from [authentication](#authentication) needs to be specified in the HTTP Authorization header

```js
request
	.get('http://localhost:9005/api/v1.0/surveys')
	.set('Authorization', 'Bearer ' + jwt)
	.end(function (err, res) {
		console.log(res.status); // 200
		console.log(res.body);   // []
	});
```

If authorization fails HTTP status will be 401 (Unauthorized) or 403 (Forbidden) based on what is included in the Authorization header.

### System Administration

Before any participant can use system, questions and surveys that are to be answered by the participants must be loaded.  In particular one of the surveys must be specified as a profile survey.  If the registry requires consent documents they must also be loaded.

This section describes all the administrative API to achieve these tasks.  Majority of these tasks can also be done during installation with registry specific system initialization scripts.

All the tasks in this section requires `admin` authorization.

##### Questions

