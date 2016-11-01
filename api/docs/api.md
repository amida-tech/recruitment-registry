## Integration Document

### Introduction

##### Code Snippets

All node.js code snippets in the document use [superagent](https://github.com/visionmedia/superagent).  This package can be installed by `npm`
```
$ npm install superagent
```

Package needs to be required before running the snippets
```js
const request = require('superagent');
```

Snippets in the later stages of the document can depend on variables that are defined in previous snippets.

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

Before any participant can use system, questions and surveys that are to be answered by the participants must be posted to the system.  In particular one of the surveys must be specified as a profile survey.  If the registry requires consent documents they must also be posted.

This section describes all the administrative API to achieve these tasks.  Majority of these tasks can also be done during installation with registry specific system initialization scripts.

All the tasks in this section requires `admin` authorization.

##### Questions

Questions can be posted to the system either individually or as part of a [survey](#admin-surveys).  Either way they are stored independently and can be shared by multiple surveys.

There are four types of questions: text, bool, choice and choices.

Text questions are the simplest kind where answers are expected to be free text

```js
let textQx = {
	type: 'text',
	text: 'Please describe reason for your enrollment?'
};
```

Bool questions are yes/no questions

```js
let boolQx = {
	type: 'bool',
	text: 'Do you own a pet?'
};
```

Choice questions are multiple choice questions where there is only one valid selection

```js
let choiceQx = {
    type: 'choice',
    text: 'What is your hair color?',
    oneOfChoices: [
        'Black',
        'Brown',
        'Blonde',
        'Other'
    ]
};
```

Choices questions are multiple choice questions where multiple selections are possible.  In addition some choices can be free text

```js
let choicesText = {
    type: 'choices',
    text: 'What kind of exercises do you do?',
    choices: [
        { text: 'Walking' },
        { text: 'Jogging', type: 'bool' },
        { text: 'Cycling', type: 'bool' },
        { text: 'Please specify other', type: 'text' }
    ],
};
```

When not specified `type` property in a `choices` element is assumed to be `bool`.  Choice questions can also be specified in a similar format

```js
choiceQx = {
    type: 'choice',
    text: 'What is your hair color?',
    choices: [
        { text: 'Black'},
        { text: 'Brown'},
        { text: 'Blonde'},
        { text: 'Other'}
    ]
};
```

It an error to specify `type` for `choices` element for `choice` question.

Once you have the JSON description of the question they can be simply posted to system

```js
let choiceQxId = null;
request
	.post('http://localhost:9005/api/v1.0/questions')
	.set('Authorization', 'Bearer ' + jwt)
	.send(choiceQx)
	.end(function (err, res) {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of question
		choiceQxId = res.body.id;
	});
```

If successful this post will return HTTP status 201 (Created) and the question `id` will be in the body.  If post fails the HTTP status will be one of 40x codes or 500 depending on the error type - 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error).

##### Surveys
<a name="admin-surveys"/>

