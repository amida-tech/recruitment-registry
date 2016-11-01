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

This section describes basic administrative API to achieve these tasks.  Majority of these tasks can also be done during installation with registry specific system initialization scripts.  In addition the input format of resources (questions, surveys, consent documents) are also examplified.

More administration functionality can be found [Advanced System Administration](#advanced-system-admin) and [Multi Lingual Support](#multi-lingual-support).

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

If successful this post will return HTTP status 201 (Created) and the question `id` will be in the body.  If post fails the HTTP status will be one of 40x codes or 500 depending on the error type - 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error).  In the rest of document `choicesQxId`, `textQxId` or `boolQxId` are used in snippets as well.  They can be created just like `choiceQxId` above.

##### Surveys
<a name="admin-surveys"/>

Surveys serve as question containers.  In the simplest case a survey can be defined with its questions.  In that case the questions will be created on the fly when posted

```js
let survey = {
    name: 'Example',
    questions: [{
        text: 'Which sports do you like?',
        required: false,
        type: 'choices',
        choices: [
            { text: 'Football' },
            { text: 'Basketball' },
            { text: 'Soccer' },
            { text: 'Tennis' }
        ]
    }, {
        text: 'What is your hair color?',
        required: true,
        type: 'choice',
        choices: [
            { text: 'Black' },
            { text: 'Brown' },
            { text: 'Blonde' },
            { text: 'Other' }
        ]
    }, {
        text: 'Where were you born?',
        required: true,
        type: 'text'
    }, {
        text: 'Are you injured?',
        required: false,
        type: 'bool'
    }]
};
```

Notice that for each question, it must be specified the question is required to be answered.

Alternatively surveys can be defined using existing questions

```js
survey = {
    name: 'Example',
    questions: [{
        required: false,
        id: textQxId
    }, {
        required: true,
        id: boolQxId
    }, {
        required: true,
        id: choiceQxId
    }, {
        required: false,
        id: choicesQxId
    }]
};
```

A mix is also possible

```js
survey = {
    name: 'Example',
    questions: [{
        required: false,
        id: textQxId
    }, {
        required: true,
        id: boolQxId
    }, {
        text: 'What is your hair color?',
        required: true,
        type: 'choice',
        choices: [
            { text: 'Black' },
            { text: 'Brown' },
            { text: 'Blonde' },
            { text: 'Other' }
        ]
    }, {
        required: false,
        id: choicesQxId
    }]
};
```

Once you have the JSON description of the survey they can be simply posted to system

```
let surveyId = null;
request
	.post('http://localhost:9005/api/v1.0/surveys')
	.set('Authorization', 'Bearer ' + jwt)
	.send(survey)
	.end(function (err, res) {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the survey
		surveyId = res.body.id;
	});
```

If successful this post will return HTTP status 201 (Created) and the survey `id` will be in the body.  If post fails the HTTP status will be one of 40x codes or 500 depending on the error type - 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error).

##### Profile Survey

The system is required to have one special survey called profile survey.  This special survey is used during registration of participants and contains all the questions needed for registration.  JSON definition of this survey does not have any difference from other surveys and is desribed in [survey administration](#admin-surveys).  Only posting differs

```
let profileSurveyId = null;
request
	.post('http://localhost:9005/api/v1.0/profile-survey')
	.set('Authorization', 'Bearer ' + jwt)
	.send(survey)
	.end(function (err, res) {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the survey
		profileSurveyId = res.body.id;
	});
```

Response details are identical to posting an ordinary survey.

##### Consent Documents

Recruitment Registries support multiple consent document types.  Consent Types in this API may refer to actual Consent Forms or similar documents that participants have to sign such as Terms Of Use.  Separate API paths are provided for Consent Types and Consent Documents as it is expected to have versions of Consent Document of the same type with only one of them being active at one time.

Consent Type JSON descriptions are minimal

```js
let consentTypeTOU = {
    name: 'terms-of-use',
    title: 'Terms of Use',
    type: 'single'
};

let consentTypeConsent = {
    name: 'consent',
    title: 'Consent Form',
    type: 'single'
}
```

Property `title` is shown in listings of consent documents and `type` is designed to be used by clients for [SAGE](#sage) support where various icons can be shown based on type.  Once you have the JSON definition of a type, it can be simply posted

```
let consentTypeTOUId = null;
request
	.post('http://localhost:9005/api/v1.0/consent-types')
	.set('Authorization', 'Bearer ' + jwt)
	.send(survey)
	.end(function (err, res) {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the consent type
		consentTypeTOUId = res.body.id;
	});
```

and similarly for `consentTypeConsentId`.  Once types are created actual consent documents can be posted with their content specified in JSON `content` field

```
let consentDocTOU = {
	typeId: consentTypeTOUId,
	content: 'This is a terms of use document.'
};

request
	.post('http://localhost:9005/api/v1.0/consent-documents')
	.set('Authorization', 'Bearer ' + jwt)
	.send(consentDocTOU)
	.end(function (err, res) {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the consent document
		consentDocTOUId = res.body.id;
	});
```

Both `consent-types` and `consent-documents` paths return HTTP status 201 (Created) and the `id`'s' will be in the body.  If post fails the HTTP status will be one of 40x codes or 500 depending on the error type - 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error).

### Multi Lingual Support
<a name="multi-lingual-support"/>

### Advanced System Administration
<a name="advanced-system-admin"/>

### SAGE
<a name="sage"/>

