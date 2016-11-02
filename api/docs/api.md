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

Snippets in the later stages of the document can depend on variables that are defined in previous snippets.  Each snippet is a promised an can be chained.  A full chain, [run-all.js](./run-all.js), that starts from a clean database and exercises all the snippets is included in the repository.

##### Seed Data

Recruitment Registry installations come with a super user who has `admin` priviledges.  In this document it is assumed that the username and password are super and Am!d@2017PW.

### Authentication
<a name="authentication"/>

This API uses Basic Authentication where username and password are passed to path `/auth/basic` in the HTTP Authorization header as `Basic code` where code is base64 encoded string for `username:password`.  Most HTTP clients provide a specific option for this authentication including superagent

```js
let jwt;
request
    .get('http://localhost:9005/api/v1.0/auth/basic')
    .auth('super', 'Am!d@2017PW')
    .then(res => {
    	console.log(res.status); // 200
    	console.log(res.body);   // {token: ...}
    	jwt = res.body.token;
    });
```
or curl

```
$ curl --user 'super:Am!d@2017PW' http://localhost:9005/api/v1.0/auth/basic`
```

Server responds with a [JSON Web Token](https://jwt.io/) (JWT) in the response body

```js
{
	"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdXBlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTQ3Nzk2MTYxNSwiZXhwIjoxNDgwNTUzNjE1fQ.HJubwTIVEf7Z-83oUTWDVu0AEx-_8DZL46lmZo2WVTo"
}
```

JWT needs to be stored on the client and is used in other API calls for [authorization](#authorization).

### Authorization
<a name="authorization"/>

For all API calls that require authorization, the JSON Web Token that is obtained from [authentication](#authentication) is specified in the HTTP Authorization header

```js
request
	.get('http://localhost:9005/api/v1.0/surveys')
	.set('Authorization', 'Bearer ' + jwt)
	.then(res => {
		console.log(res.status); // 200
		console.log(res.body);   // []
	});
```

### HTTP Status Codes and Error Messages

This API return the following HTTP status codes for success

- 200 (OK): Used for [GET] requests when there server responds with an object in the response body
- 201 (Created): Used for [POST] requests that create new records.  For all posts that create a new record the id is included in the response body (Ex: `{id: 5}`)
- 204 (No Content): Used for all requests (typically [PATCH] and [DELETE]) that returns no content

In the case of error the following error codes are used

- 400 (Bad Request): Indicates bad parameter(s) is/are passed to the API.  This can be wrong input object format, invalid value (for example not existing id) or constraint violations such as trying to create a new user with the same username.
- 401 (Unauthorized): Indicates JWT specified in the Authorization header is invalid or does not correspond to an active user.
- 403 (Forbidden): Indicates JWT specified in the Authorization header is valid and corresponds to a user but that user does not have permission to access to the API path.
- 404 (Not Found): Indicates paths does not exist.
- 500 (Internal Server Error): These are unexpected run time errors.

When server responds with an error status, an error object is always included in the response body and minimally contains `message` property.

### System Administration
<a name="system-administration"/>

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
let choicesQx = {
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
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of question
		choiceQxId = res.body.id;
	});
```

The server responds with the question `id` in the response body.  In the rest of this other questions specified in this section is also assumed to be posted similarly.

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
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the survey
		surveyId = res.body.id;
	});
```
The server responds with the survey `id` in the response body.

##### Profile Survey
<a name="admin-profile-survey"/>

The system is required to have one special survey called profile survey.  This special survey is used during registration of participants and contains all the questions needed for registration.  JSON definition of this survey does not have any difference from other surveys as desribed in [survey administration](#admin-surveys).  For posting however there is a special path

```
const profileSurvey = {
    name: 'Alzheimer',
    questions: [{
        text: 'Gender',
        required: true,
        type: 'choice',
        oneOfChoices: ['male', 'female', 'other']
    }, {
        text: 'Zip code',
        required: false,
        type: 'text'
    }, {
        text: 'Family history of memory disorders/AD/dementia?',
        required: true,
        type: 'bool'
    }, {
        text: 'How did you hear about us?',
        required: false,
        type: 'choices',
        choices: [
            { text: 'TV' },
            { text: 'Radio' },
            { text: 'Newspaper' },
            { text: 'Facebook/Google Ad/OtherInternet ad' },
            { text: 'Physician/nurse/healthcare professional' },
            { text: 'Caregiver' },
            { text: 'Friend/Family member' },
            { text: 'Other source', type: 'text' }
        ]
    }]
};

request
	.post('http://localhost:9005/api/v1.0/profile-survey')
	.set('Authorization', 'Bearer ' + jwt)
	.send(profileSurvey)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the profile survey
	});
```

Server response details are identical to posting an ordinary survey.

##### Consent Documents
<a name="admin-consent-document"/>

Recruitment Registries support multiple consent document types.  Consent Types in this API may refer to actual Consent Forms or similar documents that participants have to sign such as Terms Of Use.  Separate API paths are provided for Consent Types and Consent Documents since it is expected to have versions of Consent Document of the same type with only one of them being active at one time.

Consent Type JSON descriptions are minimal

```js
let consentTypeTOU = {
    name: 'terms-of-use',
    title: 'Terms of Use',
    type: 'single'
};

let consentTypeConsent = {
    name: 'init-consent',
    title: 'Consent Form',
    type: 'single'
}
```

Property `title` is shown in listings of consent documents and `type` is designed to be used by clients for [SAGE](#sage) support where various icons can be shown based on type.  Once you have the JSON definition of a consnt type, it can be simply posted

```js
let consentTypeTOUId = null;
request
	.post('http://localhost:9005/api/v1.0/consent-types')
	.set('Authorization', 'Bearer ' + jwt)
	.send(survey)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the consent type
		consentTypeTOUId = res.body.id;
	});
```

The server responds with the consent document type `id` in the response body.  This type is needed to post the actual consent documents with its content

```js
let consentDocTOU = {
	typeId: consentTypeTOUId,
	content: 'This is a terms of use document.'
};

request
	.post('http://localhost:9005/api/v1.0/consent-documents')
	.set('Authorization', 'Bearer ' + jwt)
	.send(consentDocTOU)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // Expected to be internal id of the consent document
		consentDocTOUId = res.body.id;
	});
```

The server responds with the consent document `id` in the response body.  The rest of this document assumes that the second type in this section (`init-consent`) is similary created.

### Registration

This section describes the API that is needed to register a participant.  During registration participants are expected to specify their account details `username`, `password` and `email` and answer the profile survey that has been posted in [Profile Survey Administration](#admin-profile-survey).  The profile survey is available without authorization

```js
let profileSurvey;
request
	.get('http://localhost:9005/api/v1.0/profile-survey')
	.then(res => {
		console.log(res.status);  // 200
		profileSurvey = res.body;
		console.log(JSON.stringify(profileSurvey, undefined, 4));
	});
```

Profile survey itself is similar to what is posted but also includes survey, question and choice internal id's that are needed to post answers

```js
// content of profileSurvey
{
    "id": 2,
    "name": "Alzheimer",
    "questions": [
        {
            "id": 6,
            "type": "choice",
            "text": "Gender",
            "choices": [
                {
                    "id": 13,
                    "text": "male"
                },
                {
                    "id": 14,
                    "text": "female"
                },
                {
                    "id": 15,
                    "text": "other"
                }
            ],
            "required": true
        },
        {
            "id": 7,
            "type": "text",
            "text": "Zip code",
            "required": false
        },
        {
            "id": 8,
            "type": "bool",
            "text": "Family history of memory disorders/AD/dementia?",
            "required": true
        },
        {
            "id": 9,
            "type": "choices",
            "text": "How did you hear about us?",
            "choices": [
                {
                    "id": 16,
                    "type": "bool",
                    "text": "TV"
                },
                {
                    "id": 17,
                    "type": "bool",
                    "text": "Radio"
                },
                {
                    "id": 18,
                    "type": "bool",
                    "text": "Newspaper"
                },
                {
                    "id": 19,
                    "type": "bool",
                    "text": "Facebook/Google Ad/OtherInternet ad"
                },
                {
                    "id": 20,
                    "type": "bool",
                    "text": "Physician/nurse/healthcare professional"
                },
                {
                    "id": 21,
                    "type": "bool",
                    "text": "Caregiver"
                },
                {
                    "id": 22,
                    "type": "bool",
                    "text": "Friend/Family member"
                },
                {
                    "id": 23,
                    "type": "text",
                    "text": "Other source"
                }
            ],
            "required": false
        }
    ]
}
```

Based on use-cases clients can require consent documents of certain types to be signed during registration.  As an example Terms Of Use that is posted in [Consent Document Administration](#admin-consent-document) is also available without authorization

```js
let touDocument;
request
	.get('http://localhost:9005/api/v1.0/consent-documents/type-name/terms-of-use')
	.then(res => {
		console.log(res.status);  // 200
		touDocument = res.body;
		console.log(JSON.stringify(touDocument, undefined, 4));
	})
```

As expected the document content is identical to what is posted.

```js
{
    "id": 1,
    "typeId": 1,
    "content": "This is a terms of use document.",
    "updateComment": null
}
```

`id` is needed to sign the document during registration.  Property `updateComment` is optional and collected when a consent document is updated and null here since it was not specified during post.  More on this property in [Advanced System Administration](#advanced-system-admin).

There are three seperate pieces of information required for participant registration.  First is the account information which consists of username, email, and password

```js
const user = {
	username: 'testparticipant',
	password: 'testpassword',
	email: 'test@example.com'
};
```

Second is the answers to questions.  Answers is an array where each element includes the question id and the answer

```js
const answers = [{
	questionId: 6,
	answer: { choice: 13 }
}, {
	questionId: 7,
	answer: { textValue: '20850' }
}, {
	questionId: 8,
	answer: { boolValue: true }
}, {
	questionId: 9,
	answer: {
		choices: [{
			id: 16,
			boolValue: true
		}, {
			id: 17
		}, {
			id: 23,
			textValue: 'Community event'
		}]
	}
}];
```

Notice that each answer gets a different property based on the question type.  For `choices` questions, `boolValue` property can be ignored and it is then assumed to be `true`.  `boolValue` cannot be ignored for `bool` questions.

Third piece of information is the signature of the consent form.  This is just an array of consent document id's to indicate that the participant accepted one or more consent documents during registration.  Signature is optional and consent document requirements are not validated by the API and are totally under control of the client.

```js
const signature = [1];
```

Registration post sends an object with these three pieces of information to create an account

```js
const registration = { user, answers, signature };

let jwtUser = null;
request
	.post('http://localhost:9005/api/v1.0/profiles')
	.send(registration)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body);    // {token: ...}
		jwtUser = res.body.token;
	})
```

Server responds with the JWT token for the participant so that participant does not have to be authenticated again after the registration.  For later sessions participant can be authenticated as described in [Authentication](#authentication)

```js
request
    .get('http://localhost:9005/api/v1.0/auth/basic')
    .auth('testuser', 'testpassword')
    .then(res => {
    	console.log(res.status);        // 200
    	console.log(res.body.token);   // identical to jwtUser from registration
    });
```

### Multi Lingual Support
<a name="multi-lingual-support"/>

This section describes the multi lingual support in the API.

### Advanced System Administration
<a name="advanced-system-admin"/>

This section describes more advanced functionalities in this API that is not cover in [System Administration]()

### SAGE
<a name="sage"/>

This section describes how [Sage](http://sagebase.org/platforms/governance/participant-centered-consent-toolkit/) is covered in this API.