## Recruitment Registry Integration Document

### Introduction

This document gives examples for resources available in Recruitment Registry API.

##### Code Snippets

All node.js code snippets in this document use [superagent](https://github.com/visionmedia/superagent).  This package can be installed by `npm`
```
$ npm install superagent
```

Package needs to be required before running the snippets
```js
const request = require('superagent');
const agent = request.agent();
```
`agent` stores cookies as they are returned from server.

Snippets in later stages of the document can depend on variables that are defined in previous snippets.  Each snippet is a promise and can be chained.  A full chain, [run-all.js](./run-all.js), that starts from a clean database and exercises most of the snippets is included in the repository.

##### Seed Data

Recruitment Registry installations come with a super user who has `admin` priviledges.  In this document it is assumed that the username and password are `super` and `Am!d@2017PW` respectively.

### Authentication
<a name="authentication"/>

This API uses Basic Authentication where username and password are passed to resource `/auth/basic` in the HTTP Authorization header as `Basic code` where code is the base64 encoded string for `username:password`.  Most HTTP clients provide a specific option for this authentication including superagent

```js
agent
    .get('http://localhost:9005/api/v1.0/auth/basic')
    .auth('super', 'Am!d@2017PW')
    .then(res => {
    	console.log(res.status); // 200
    	console.log(res.body);   // {token: ...}
    });
```

Server responds with a `set-cookie` header which includes a [JSON Web Token](https://jwt.io/) (JWT) as value of a cookie named `rr-jwt-token`.

### Authorization
<a name="authorization"/>

For all API resources that require authorization, the JWT cookie has to be included in the HTTP request.  Browsers and `superagent` do this automatically.

### HTTP Status Codes and Error Messages

This API uses the following HTTP status codes for success

- 200 (OK): Used for request when server responds with a resource (typically [GET]) in the response body.
- 201 (Created): Used for [POST] requests that create new resources.  New resource id is included in the response body (Ex: `{id: 5}`).
- 204 (No Content): Used for all requests (typically [PATCH] or [DELETE]) that contains no content in the response body.

In the case of error the following error codes are used

- 400 (Bad Request): Indicates bad parameter(s) is/are passed to the API.  This can be wrong input object format, invalid value (for example not existing id) or constraint violations such as trying to create a new user with the same username.
- 401 (Unauthorized): Indicates JWT specified in the Authorization header is invalid or does not correspond to an active user.
- 403 (Forbidden): Indicates JWT specified in the Authorization header is valid and corresponds to a user but that user does not have permission to access to the resource requested.
- 404 (Not Found): Indicates resource does not exist.
- 500 (Internal Server Error): Indicates an unexpected run time error.

When server responds with an error status, an error object is always included in the response body and minimally contains `message` property.

### System Administration
<a name="system-administration"/>

Before any participant can use the system, questions and surveys that are to be answered by the participants must be created.  If use cases involve consent documents and/or profile survey (a survey that needs to be answered during registration), those artifacts need to be created as well.

This section discusses administrative API to achieve these tasks.  Majority of these tasks can also be done during installation with registry specific system initialization scripts.  In addition the input format of resources (questions, surveys, consent documents, etc.) are examplified.

All API requests in this section requires `admin` authorization.

##### Questions

Questions can be created either individually or as part of a [survey](#admin-surveys).  Either way they are stored independently than surveys and can be shared.

There are four basic types of questions: `text`, `bool`, `choice` and `choices`.

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
    ]
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

It an error to specify `type` for a `choices` element for a `choice` question.

Questions are created using the `/questions` resource

```js
let choiceQxId = null;
agent
	.post('http://localhost:9005/api/v1.0/questions')
	.send(choiceQx)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // id of the new question
		choiceQxId = res.body.id;
	});
```

The server responds with the new question `id` in the response body.  In the rest of this document other questions specified in this section is also assumed to have been created similarly.

Questions can be soft deleted by `/questions/{id}` resource.  Questions can only be soft deleted if there are no active surveys that use the questions.

It is possible replace an existing question with a new version by including the query parameter `{ parent: id }` during creation.  In such cases the new and existing questions are linked in the database and the existing question is soft-deleted.  Currently there are no resources that expose linked questions on the API level.

##### Surveys
<a name="admin-surveys"/>

Surveys serve as question containers.  In the simplest case a survey can be defined with its questions.  In that case the questions are created on the fly when the survey is created

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

Notice that for each question, it must be specified if the question is required to be answered.

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

Questions can be grouped into sections.  Currenly only one level deep sections are supported

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

In addition this API supports a client specific `meta` property which can be used to store any settings that relates to user interface or any other client setting

```js
survey = {
    name: 'Example',
    meta: {
        displayAsWizard: true,
        saveProgress: false
    },
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

Survey `meta` property is stored as a JSON object and subproperties are not validated and fully client specific.  This property is not used in any business logic elsewhere.

Surveys are created using `/surveys` resource

```
let surveyId = null;
agent
	.post('http://localhost:9005/api/v1.0/surveys')
	.send(survey)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // id of the new survey
		surveyId = res.body.id;
	});
```
The server responds with the new survey `id` in the response body.

Surveys can be soft deleted by `/surveys/{id}` resource.  It is also possible replace an existing survey with a new version by including the query parameter `{ parent: id }` during creation.  In such cases the new and existing surveys are linked in the database and the existing survey is soft-deleted.  Currently there are no resources that exposes linked surveys on the API level.

##### Profile Survey
<a name="admin-profile-survey"/>

Recruitment Registries can have a special survey called profile survey that can be used during registration of participants. Profile surveys are optional but if one is specified, answers are required during registration.

Any existing survey can be assigned to be the profile survey using `/profile-survey-id` resource

```
agent
    .post('http://localhost:9005/api/v1.0/profile-survey-id')
    .send({ profileSurveyId: 1})
    .then(res => {
        console.log(res.status);  // 201
        console.log(res.body);    // id of the survey
    });
```

The id of the survey that is assigned to be the profile survey is available using `/profile-survey-id` resource

```
agent
    .get('http://localhost:9005/api/v1.0/profile-survey-id')
    .then(res => {
        console.log(res.status);  // 200
        console.log(res.body);    // id of the profile survey
    });
```

Profile survey assignment can be removed in case your modified use case does not require it anymore

```
agent
    .delete('http://localhost:9005/api/v1.0/profile-survey-id')
    .then(res => {
        console.log(res.status);  // 204
    });
```

An additional resource `/profile-survey` is available to create a new survey and assign it as the profile survey with one call. JSON definition of the input survey is as described in [survey administration](#admin-surveys)

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

agent
	.post('http://localhost:9005/api/v1.0/profile-survey')
	.send(profileSurvey)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // id of the profile survey
	});
```

Server responds with the profile survey `id` in the response body.

##### Consent Documents
<a name="admin-consent-document"/>

Recruitment Registries support multiple consent document types.  Consent Types in this API may refer to an actual Consent Form or other document types that participants have to sign such as Terms Of Use.  Separate resources are provided for Consent Types and Consent Documents since it is expected to have evolving versions of Consent Documents of the same type.  This API enforces to have a single active Consent Document of a certain Consent Type at any point in time; when a new Consent Document of a particular type is created, the previous active one is deactivated.

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

Property `title` is shown in listings of consent documents and `type` is designed to be used by clients for [SAGE](#sage) support where various icons can be shown based on type.  Consent types are created using `/consent-types` resource

```js
let consentTypeTOUId = null;
agent
	.post('http://localhost:9005/api/v1.0/consent-types')
	.send(consentTypeTOU)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // id of the new consent type
		consentTypeTOUId = res.body.id;
	});
```

The server responds with the consent type `id` in the response body.  The `type` id is needed to create the actual consent documents with its content using `consent-documents` resource

```js
let consentDocTOU = {
	typeId: consentTypeTOUId,
	content: 'This is a terms of use document.'
};

agent
	.post('http://localhost:9005/api/v1.0/consent-documents')
	.send(consentDocTOU)
	.then(res => {
		console.log(res.status);  // 201
		console.log(res.body.id); // id of the new consent document
		consentDocTOUId = res.body.id;
	});
```

The server responds with the consent document `id` in the response body.  The rest of this document assumes that the second type in this section (`consent`) is similary created.

This API does not provide a resource to delete Consent Documents since there is no need.  If a certain Consent Type is not needed resource `/consent_types/{id}` can be used.  This will soft delete the Consent Type and the active Consent Document with that type.

### Registration
<a name="registration"/>

This section describes the resources that are needed to register a participant.  During registration participants are expected to specify their account details `username`, `password` and `email`. If a profile server has been specified as in [Profile Survey Administration](#admin-profile-survey) then answers to the profile survey have to be specifed specified as well.

The profile survey is available without authorization using `/profile-survey` resource

```js
let profileSurvey;
agent
	.get('http://localhost:9005/api/v1.0/profile-survey')
	.then(res => {
		console.log(res.status);  // 200
		profileSurvey = res.body;
		console.log(JSON.stringify(profileSurvey, undefined, 4));
	});
```

Server responds with the profile survey in response body and includes survey, question and choice id's that are needed to create answers.

```js
// content of profileSurvey
{
    "exists": true,
    "survey": {
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
}
```

If no profile survey is specified for the system, `exists` flag is set to false and no answers is required.

Based on use-cases clients can require consent documents of certain types to be signed during registration.  As an example Terms Of Use ( see [Consent Document Administration](#admin-consent-document)) is available without authorization

```js
let touDocument;
agent
	.get('http://localhost:9005/api/v1.0/consent-documents/type/1')
	.then(res => {
		console.log(res.status);  // 200
		touDocument = res.body;
		console.log(JSON.stringify(touDocument, undefined, 4));
	})
```

Server responds with the consent document content in the response body

```js
{
    "id": 1,
    "typeId": 1,
    "content": "This is a terms of use document.",
    "updateComment": null
}
```

Consent Document `id` is needed to sign the document during registration.  Property `updateComment` is optional and collected when a consent document is updated.

There are three seperate pieces of information that might be required for participant registration.  First is the account information which consists of username, email, and password and is always required

```js
const user = {
	username: 'testparticipant',
	password: 'testpassword',
	email: 'test@example.com'
};
```

Second is the answers to profile survey questions if a profile survey is specifed.  JSON desription of answers is an array where each element includes the question id and the answer

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

Third piece of information is the signatures for the Consent Documents that are required during registration.  Signatures are simply indicated by the id of the Consent Documents the participant saw and accepted during registration.  Signatures are optional and Consent Document requirements are not validated by the API and are totally under the control of the client.

```js
const signatures = [1];
```

Registration is completed using `/profiles` resource

```js
const registration = { user, answers, signatures };

agent
	.post('http://localhost:9005/api/v1.0/profiles')
	.send(registration)
	.then(res => {
		console.log(res.status);  // 201
	})
```

Server responds with the JWT cookie for the participant so that participant does not have to be authenticated again after the registration.  For later sessions participants are authenticated as described in [Authentication](#authentication)

```js
agent
    .get('http://localhost:9005/api/v1.0/auth/basic')
    .auth('testuser', 'testpassword')
    .then(res => {
    	console.log(res.status);     // 200
    });
```

This completes the registration.

### Profiles
<a name="profile"/>

Participant profile is the account information and the profile survey answers that are created during [Registration](#registration).  Consent document signatures, which can also be collected during registration, are not considered part of profile and discussed in [Consent Documents](#consent-document) section.

Existing profiles are available to authorized participants using `/profiles` resource

```js
agent
	.get('http://localhost:9005/api/v1.0/profiles')
	.then(res => {
		console.log(res.status);                                // 200
		console.log(JSON.stringify(res.body, undefined, 4));    // profile
	});
```

Server responds with the profile in the response body.  Profile contains account information, profile survey questions and answers

```js
{
    "user": {
        "id": 2,
        "username": "testparticipant",
        "email": "test@example.com",
        "role": "participant"
    },
    "survey": {
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
                "required": true,
                "language": "en",
                "answer": {
                    "choice": 13
                }
            },
            {
                "id": 7,
                "type": "text",
                "text": "Zip code",
                "required": false,
                "language": "en",
                "answer": {
                    "textValue": "20850"
                }
            },
            {
                "id": 8,
                "type": "bool",
                "text": "Family history of memory disorders/AD/dementia?",
                "required": true,
                "language": "en",
                "answer": {
                    "boolValue": true
                }
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
                "required": false,
                "language": "en",
                "answer": {
                    "choices": [
                        {
                            "id": 16,
                            "boolValue": true
                        },
                        {
                            "id": 17,
                            "boolValue": true
                        },
                        {
                            "id": 23,
                            "textValue": "Community event"
                        }
                    ]
                }
            }
        ]
    }
}
```

Answers are only returned for systems where a profile survey is required.

Once profile is created only email and password can be updated for account information.  Any profile survey answer can be resubmitted.  Answers will be updated only for resubmitted questions.  For each resubmitted question all the old answers will be soft deleted.  If a `questionId` is specified without any answer the old answer will be removed for questions that are not required

```js
const user = {
	email: 'test2@example2.com'
};

const answers = [{
	questionId: 6,
	answer: { choice: 14 }
}, {
	questionId: 7
}, {
	questionId: 8,
	answer: { boolValue: false }
}, {
	questionId: 9,
	answer: {
		choices: [{
			id: 15,
			boolValue: true
		}, {
			id: 23,
			textValue: 'Community event'
		}]
	}
}];

agent
	.patch('http://localhost:9005/api/v1.0/profiles')
	.send({ user, answers })
	.then(res => {
		console.log(res.status);  // 204
	})
```

Server does not return any content after updates.  Updated profile is available using `/profiles` resource as disccused earlier in this section

```js
{
    "user": {
        "id": 2,
        "username": "testparticipant",
        "email": "test2@example2.com",
        "role": "participant"
    },
    "survey": {
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
                "required": true,
                "language": "en",
                "answer": {
                    "choice": 14
                }
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
                "required": true,
                "language": "en",
                "answer": {
                    "boolValue": false
                }
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
                "required": false,
                "language": "en",
                "answer": {
                    "choices": [
                        {
                            "id": 15,
                            "boolValue": true
                        },
                        {
                            "id": 23,
                            "textValue": "Community event"
                        }
                    ]
                }
            }
        ]
    }
}
```

### User Management

Participants are expected to use `/profiles` resource to register. But a `admin` only `/users` resource is also provided and can be used to create a new user

```js
const user = {
    username: 'test2participant',
    password: 'test2password',
    email: 'test2@example.com'
};

let jwtUser2 = null;
agent
    .post('http://localhost:9005/api/v1.0/users')
    .send(user)
    .then(res => {
        console.log(res.status);  // 201
        console.log(res.body);    // {token: ...}
        jwtUser2 = res.body.token;
    });
```

### Questions

A list of all questions is available to admins using resource `/questions`

```js
agent
    .get('http://localhost:9005/api/v1.0/questions')
    .then(res => {
        console.log(res.status);  // 200
        const questionList = res.body;
        console.log(JSON.stringify(questionList, undefined, 4));
    });
```

Server responds with the list in the response body

```js
[
    {
        "id": 1,
        "type": "text",
        "text": "Please describe reason for your enrollment?"
    },
    {
        "id": 2,
        "type": "bool",
        "text": "Do you own a pet?"
    },
    {
        "id": 3,
        "type": "choice",
        "text": "What is your hair color?",
        "choices": [
            {
                "id": 1,
                "text": "Black"
            },
            {
                "id": 2,
                "text": "Brown"
            },
            {
                "id": 3,
                "text": "Blonde"
            },
            {
                "id": 4,
                "text": "Other"
            }
        ]
    },
    {
        "id": 4,
        "type": "choices",
        "text": "What kind of exercises do you do?",
        "choices": [
            {
                "id": 5,
                "type": "bool",
                "text": "Walking"
            },
            {
                "id": 6,
                "type": "bool",
                "text": "Jogging"
            },
            {
                "id": 7,
                "type": "bool",
                "text": "Cycling"
            },
            {
                "id": 8,
                "type": "text",
                "text": "Please specify other"
            }
        ]
    },
    {
        "id": 5,
        "type": "choice",
        "text": "What is your hair color?",
        "choices": [
            {
                "id": 9,
                "text": "Black"
            },
            {
                "id": 10,
                "text": "Brown"
            },
            {
                "id": 11,
                "text": "Blonde"
            },
            {
                "id": 12,
                "text": "Other"
            }
        ]
    },
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
        ]
    },
    {
        "id": 7,
        "type": "text",
        "text": "Zip code"
    },
    {
        "id": 8,
        "type": "bool",
        "text": "Family history of memory disorders/AD/dementia?"
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
        ]
    }
]
```

Individual questions can be shown using `/questions/{id}` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/questions/1')
    .then(res => {
        console.log(res.status);  // 200
        const question = res.body;
        console.log(JSON.stringify(question, undefined, 4));
    });
```

### Surveys
<a name="surveys"/>

A list of all surveys in the registry is available to authorized participants and admins using resource `/surveys`

```js
agent
	.get('http://localhost:9005/api/v1.0/surveys')
	.then(res => {
		console.log(res.status);  // 200
		const surveyList = res.body;
		console.log(JSON.stringify(surveyList, undefined, 4));
	});
```

Server responds with the list in the response body.  Each entry in the list includes `id` and `name` fields

```js
[
    {
        "id": 1,
        "name": "Example"
    },
    {
        "id": 2,
        "name": "Alzheimer"
    }
]
```

Individual surveys can be shown using `/surveys/{id}` resource

```js
agent
	.get('http://localhost:9005/api/v1.0/surveys/1')
	.then(res => {
		console.log(res.status);  // 200
		const survey = res.body;
		console.log(JSON.stringify(survey, undefined, 4));
	});
```

Server responds with all the survey details and in particular its questions

```js
{
    "id": 1,
    meta: {
        displayAsWizard: true,
        saveProgress: false
    },
    "name": "Example",
    "questions": [
        {
            "id": 1,
            "type": "text",
            "text": "Please describe reason for your enrollment?",
            "required": false
        },
        {
            "id": 2,
            "type": "bool",
            "text": "Do you own a pet?",
            "required": true
        },
        {
            "id": 5,
            "type": "choice",
            "text": "What is your hair color?",
            "choices": [
                {
                    "id": 9,
                    "text": "Black"
                },
                {
                    "id": 10,
                    "text": "Brown"
                },
                {
                    "id": 11,
                    "text": "Blonde"
                },
                {
                    "id": 12,
                    "text": "Other"
                }
            ],
            "required": true
        },
        {
            "id": 4,
            "type": "choices",
            "text": "What kind of exercises do you do?",
            "choices": [
                {
                    "id": 5,
                    "type": "bool",
                    "text": "Walking"
                },
                {
                    "id": 6,
                    "type": "bool",
                    "text": "Jogging"
                },
                {
                    "id": 7,
                    "type": "bool",
                    "text": "Cycling"
                },
                {
                    "id": 8,
                    "type": "text",
                    "text": "Please specify other"
                }
            ],
            "required": false
        }
    ]
}
```

Survey details include `id` fields for the survey, its questions, and question choices.

JSON definition of answers is an array of objects where each object includes the id of the question being answered and the actual answer

```js
const answers = [{
	questionId: 1,
	answer: { textValue: 'Try new medicine' }
}, {
	questionId: 2,
	answer: { boolValue: false }
}, {
	questionId: 5,
	answer: { choice: 4 }
}, {
	questionId: 4,
	answer: {
		choices: [{
			id: 5,
			boolValue: true
		}, {
			id: 7
		}, {
			id: 8,
			textValue: 'Soccer'
		}]
	}
}];
```

Notice that the format of the answer depends on the type of question.  It is an error to use properties for one type of question for the other.  For `choices` type questions `boolValue` property of individual choices can be safely omitted and defaults to `true`.  For bool type questions `boolValue` property is required.  Answers can be posted using `/answers` resource

```js
agent
	.post('http://localhost:9005/api/v1.0/answers')
	.send({ surveyId: 1, answers })
	.then(res => {
		console.log(res.status);  // 204
	});
```

Answers to a survey can be shown using `/answers` resource

```js
agent
	.get('http://localhost:9005/api/v1.0/answers')
	.query({ 'survey-id': 1})
	.then(res => {
		console.log(res.status);  // 200
		console.log(JSON.stringify(res.body, undefined, 4)); // answers
	});
```

Server responds with answers in the the response body and the format is identical to how answers are created except an additional language field which is by default is English (en).  Language field identifies the language that the participant saw the survey in and [dictated by the client](#language_spec)

```js
[
    {
        "questionId": 1,
        "language": "en",
        "answer": {
            "textValue": "Try new medicine"
        }
    },
    {
        "questionId": 2,
        "language": "en",
        "answer": {
            "boolValue": false
        }
    },
    {
        "questionId": 4,
        "language": "en",
        "answer": {
            "choices": [
                {
                    "id": 5,
                    "boolValue": true
                },
                {
                    "id": 7,
                    "boolValue": true
                },
                {
                    "id": 8,
                    "textValue": "Soccer"
                }
            ]
        }
    },
    {
        "questionId": 5,
        "language": "en",
        "answer": {
            "choice": 4
        }
    }
]
```

It is possible to show a survey with its answers using resource `/answered-surveys/{id}`

```js
agent
	.get('http://localhost:9005/api/v1.0/answered-surveys/1')
	.then(res => {
		console.log(res.status);  // 200
		console.log(JSON.stringify(res.body, undefined, 4)); // survey with answers
	});
```

Survey responds with the survey details in the response body.  Survey details is similar to `/surveys/{id}` resource response but also includes the answers for each question

```js
{
    "id": 1,
    "meta": {
        "displayAsWizard": true,
        "saveProgress": false
    },
    "name": "Example",
    "questions": [
        {
            "id": 1,
            "type": "text",
            "text": "Please describe reason for your enrollment?",
            "required": false,
            "language": "en",
            "answer": {
                "textValue": "Try new medicine"
            }
        },
        {
            "id": 2,
            "type": "bool",
            "text": "Do you own a pet?",
            "required": true,
            "language": "en",
            "answer": {
                "boolValue": false
            }
        },
        {
            "id": 5,
            "type": "choice",
            "text": "What is your hair color?",
            "choices": [
                {
                    "id": 9,
                    "text": "Black"
                },
                {
                    "id": 10,
                    "text": "Brown"
                },
                {
                    "id": 11,
                    "text": "Blonde"
                },
                {
                    "id": 12,
                    "text": "Other"
                }
            ],
            "required": true,
            "language": "en",
            "answer": {
                "choice": 4
            }
        },
        {
            "id": 4,
            "type": "choices",
            "text": "What kind of exercises do you do?",
            "choices": [
                {
                    "id": 5,
                    "type": "bool",
                    "text": "Walking"
                },
                {
                    "id": 6,
                    "type": "bool",
                    "text": "Jogging"
                },
                {
                    "id": 7,
                    "type": "bool",
                    "text": "Cycling"
                },
                {
                    "id": 8,
                    "type": "text",
                    "text": "Please specify other"
                }
            ],
            "required": false,
            "language": "en",
            "answer": {
                "choices": [
                    {
                        "id": 5,
                        "boolValue": true
                    },
                    {
                        "id": 7,
                        "boolValue": true
                    },
                    {
                        "id": 8,
                        "textValue": "Soccer"
                    }
                ]
            }
        }
    ]
}
```

### User Surveys
<a name="user-surveys"/>

This API supports use cases where a survey has a status for each participant. Possible status values are `new`, `in-progress` and `completed`. It is clients responsibility to assign status.  To mark a survey `completed` each required question has to be answered; status `in-progress` status allows partial answers where required questions might be left unanswered.

Resource `/user-surveys` is used to list surveys and their status for a user

```js
agent
    .get('http://localhost:9005/api/v1.0/user-surveys')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // survey list with status with answers
    });
```

Server responds with the list of user surveys in the body

```js
[
    {
        "id": 1,
        "name": "Example",
        "status": "new"
    },
    {
        "id": 2,
        "name": "Alzheimer",
        "status": "new"
    }
]

```

Status can be changed when answering the survey using resource `/user-surveys/{id}/answers`.  If status is set to `in-progress` required questions can be left unanswered

```js
const answers = [{
    questionId: 2,
    answer: { boolValue: true }
}, {
    questionId: 5,
    answer: { choice: 6 }
}];

agent
    .post('http://localhost:9005/api/v1.0/user-surveys/1/answers')
    .send({ status: 'in-progress', answers })
    .then(res => {
        console.log(res.status);  // 204
    });
```

Answers and status are available using resource `/user-surveys/{id}/answers`

```js
agent
    .get('http://localhost:9005/api/v1.0/user-surveys/1/answers')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // answers with status
    });
```

Server responds with the answers in the body

```js
{
    "status": "in-progress",
    "answers": [
        {
            "questionId": 2,
            "language": "en",
            "answer": {
                "boolValue": true
            }
        },
        {
            "questionId": 5,
            "language": "en",
            "answer": {
                "choice": 6
            }
        }
    ]
}
```

List of user surveys reflect to status change

```
[
    {
        "id": 1,
        "name": "Example",
        "status": "in-progress"
    },
    {
        "id": 2,
        "name": "Alzheimer",
        "status": "new"
    }
]
```

Additional answers can be added and status can be changed to `completed`

```js
const answers = [{
    questionId: 1,
    answer: { textValue: 'Try another medicine' }
}, {
    questionId: 4,
    answer: {
        choices: [{
            id: 5,
            boolValue: true
        }, {
            id: 8,
            textValue: 'Basketball'
        }]
    }
}];

agent
    .post('http://localhost:9005/api/v1.0/user-surveys/1/answers')
    .send({ status: 'completed', answers })
    .then(res => {
        console.log(res.status);  // 204
    });
```

Answers and status are also available using resource `/user-surveys/{id}`.  This resource responds with answers as parts of questions

```js
agent
    .get('http://localhost:9005/api/v1.0/user-surveys/1')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // answers with status
    });
```

Server responds with the answered survey and the status in the body

```js
{
    "status": "completed",
    "survey": {
        "id": 1,
        "meta": {
            "displayAsWizard": true,
            "saveProgress": false
        },
        "name": "Example",
        "questions": [
            {
                "id": 1,
                "type": "text",
                "text": "Please describe reason for your enrollment?",
                "required": false,
                "language": "en",
                "answer": {
                    "textValue": "Try another medicine"
                }
            },
            {
                "id": 2,
                "type": "bool",
                "text": "Do you own a pet?",
                "required": true,
                "language": "en",
                "answer": {
                    "boolValue": true
                }
            },
            {
                "id": 5,
                "type": "choice",
                "text": "What is your hair color?",
                "choices": [
                    {
                        "id": 9,
                        "text": "Black"
                    },
                    {
                        "id": 10,
                        "text": "Brown"
                    },
                    {
                        "id": 11,
                        "text": "Blonde"
                    },
                    {
                        "id": 12,
                        "text": "Other"
                    }
                ],
                "required": true,
                "language": "en",
                "answer": {
                    "choice": 6
                }
            },
            {
                "id": 4,
                "type": "choices",
                "text": "What kind of exercises do you do?",
                "choices": [
                    {
                        "id": 5,
                        "type": "bool",
                        "text": "Walking"
                    },
                    {
                        "id": 6,
                        "type": "bool",
                        "text": "Jogging"
                    },
                    {
                        "id": 7,
                        "type": "bool",
                        "text": "Cycling"
                    },
                    {
                        "id": 8,
                        "type": "text",
                        "text": "Please specify other"
                    }
                ],
                "required": false,
                "language": "en",
                "answer": {
                    "choices": [
                        {
                            "id": 5,
                            "boolValue": true
                        },
                        {
                            "id": 8,
                            "textValue": "Basketball"
                        }
                    ]
                }
            }
        ]
    }
}
```

### Consent Documents
<a name="consent-document"/>

Participant have to sign registry specific Consent Documents to be able to get access to various functionality. Currently this API does not enforce any requirement on consent documents itself and leaves any requirement enforcement to clients.  Consent Document API stores and provides content and signature status of consent documents.

All consent documents that has to be signed for a user is shown by resource `/user-consent-documents`

```js
agent
	.get('http://localhost:9005/api/v1.0/user-consent-documents')
	.then(res => {
		console.log(res.status);  // 200
		console.log(JSON.stringify(res.body, undefined, 4)); // unsigned consent documents
	});
```

Server responsds withs a list in the response body that shows id of the consent document and type information

```js
[
    {
        "id": 2,
        "name": "consent",
        "title": "Consent Form"
    }
]
```

It is also possible to show already signed documents in the list with parameter `include-server`.

```js
agent
    .get('http://localhost:9005/api/v1.0/user-consent-documents?include-signed')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // all consent documents
    });
```

In this case sigature status also shown

```js
[
    {
        "id": 1,
        "name": "terms-of-use",
        "title": "Terms of Use",
        "signature": false
    },
    {
        "id": 2,
        "name": "consent",
        "title": "Consent Form",
        "signature": true,
        "language": "en"
    }
]
```

Content of the documents can be shown using user `/consent-documents/{id}` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/consent-documents/2')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // unsigned consent documents
    });
```

Server responds with details of consent document include the content in the response body

```js
{
    "id": 2,
    "typeId": 2,
    "content": "This is consent form.",
    "updateComment": null
}
```

Same information is also available using the type name of the consent document

```js
agent
    .get('http://localhost:9005/api/v1.0/consent-documents/type/2')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // unsigned consent documents
    });
```

Consent documents can be signed with `consent-signatures` resource.  This resource accepts the `id` of the consent document

```js
agent
    .post('http://localhost:9005/api/v1.0/consent-signatures')
    .send( {consentDocumentId : 2} )
    .then(res => {
        console.log(res.status);  // 201
        console.log(res.body.id); // id of the signature
    });
```

Consent documents can be shown with the signature information

```js
agent
    .get('http://localhost:9005/api/v1.0/user-consent-documents/type/2')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // consent document with signature
    });
```

Server responds with the consent document and its signature status

```js
{
    "id": 2,
    "typeId": 2,
    "content": "This is consent form.",
    "updateComment": null,
    "signature": true,
    "language": "en"
}
```

A new version of the consent document can be created using `/consent-document` resource.

```js
let consentDocUpdate = {
    typeId: 2,
    content: 'This is an updated Consent Form.',
    updateComment: 'Updated notice added'
};

agent
    .post('http://localhost:9005/api/v1.0/consent-documents')
    .send(consentDocUpdate)
    .then(res => {
        console.log(res.status);  // 201
        console.log(res.body.id); // id of the updated consent document
    });
```

Server responds with the id of the updated consent document.  Once a Consent Document is updated, it is added to the list of documents that has to be signed by the participant.  The list is shown by `/user-consent-documents` as discussed before

```js
[
    {
        "id": 3,
        "name": "consent",
        "title": "Consent Form"
    }
]
```

Resource `/consent-documents/{id}/with-signature` shows the content and the new signature status

```js
agent
    .get('http://localhost:9005/api/v1.0/user-consent-documents/3')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // consent document with signature information
    });
```

Server responds with the new signature status which is false

```js
{
    "id": 3,
    "typeId": 2,
    "content": "This is an updated Consent Form.",
    "updateComment": "Updated notice added",
    "signature": false
}
```

### Password Reset
<a name="password-reset"/>

##### SMTP

Reset password functionality requires an email delivery service specification as well as specification for the content of the reset password email. Both of these specifications are created using  `/smtp` resource

```js
const smtpSpec = {
    protocol: 'smtp',
    username: 'smtp@example.com',
    password: 'pw',
    host: 'localhost',
    from: 'admin@rr.com',
    otherOptions: {},
    subject: 'Registry Admin',
    content: 'Click on this: ${link}'
};

agent
    .post('http://localhost:9005/api/v1.0/smtp/reset-password')
    .send(smtpSpec)
    .then(res => {
        console.log(res.status);  // 204
    });
```

Notice that content of the email includes a template `${link}` which is replaced by a clickable link that the client should handle.  The link is generated by adding a reset pasword token to a client base url that is specified during system installation/start.  All `smtpSpec` properties as well as the email of the user whose password to be reset is passed to [nodemailer](https://github.com/nodemailer/nodemailer) package to be sent to destination.

SMTP specification is available using `/smtp` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/smtp/reset-password')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4));
    });
```

Server response is identical to what has been creted (`smtpSpec`).  `smtp` resource can also be deleted if reset password functionality is to be disabled.

##### Reset Tokens

Resource `/reset-tokens` is used to generate reset tokens and send an email to the user with instructions on how to reset e-mail.

```js
agent
    .post('http://localhost:9005/api/v1.0/reset-tokens')
    .send({ email: 'test2@example2.com' })
    .then(res => {
        console.log(res.status);  // 204
    });
```

Email is sent according to the specifications discussed in the previous section. The token is used in the clickable link (hyperlink) that is included in the email body.  Handling of the hyperlink is to be done by the client.  An example email based on the settings in the previous email is

```
Content-Type: text/plain
From: smtp@rr.com
To: test2@example2.com
Subject: Registry Admin
Message-ID: <49ed389d-f332-5a81-8e6e-18188cb47d36@rr.com>
X-Mailer: nodemailer (2.6.0; +http://nodemailer.com/;
 SMTP/2.7.2[client:2.12.0])
Content-Transfer-Encoding: quoted-printable
Date: Tue, 08 Nov 2016 05:27:27 +0000
MIME-Version: 1.0

Click on this: http://localhost:401/reset-tokens/1b5326eba6bea2cdfaf34f45cb=
f7b43e7ed308de
```

Reset tokens expire after a finite amount of time which by default is 1 hour.  Expiration can be specified during installation or when ever the server is restarted.

##### User Password

The link in the reset password email is to be handled by the client. It is expected that the client collects a new password for the user. Once the new password is collected, the password is updated using `/users/password` resource which also requires the reset token

```js
const passwordInfo = {
    password: 'newPassw0rd',
    token: '1b5326eba6bea2cdfaf34f45cbf7b43e7ed308de'
};

agent
    .post('http://localhost:9005/api/v1.0/users/password')
    .send(passwordInfo)
    .then(res => {
        console.log(res.status);  // 204
    });

```

### Multi Lingual Support
<a name="multi-lingual-support"/>

This API follows an English first approach where every newly created resource is assumed to be in English. After the resource is created, user facing fields of resources can be translated into any language.

##### Languages

This section describes preloaded language definitions and how to add a new language to the system. All [GET] operations in this section is available to both participants and admins while only admins are authorized for other operations.

Recruitment Registry installations are preloaded with languages that can be listed by `/languages` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/languages')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // list of languages
    });
```

Server responds with a list of languages preloaded to the system in the body

```js
[
    {
        "code": "en",
        "name": "English",
        "nativeName": "English"
    },
    {
        "code": "es",
        "name": "Spanish",
        "nativeName": "Español"
    },
    {
        "code": "fr",
        "name": "French",
        "nativeName": "Le français"
    },
    {
        "code": "jp",
        "name": "Japanese",
        "nativeName": "日本語"
    },
    {
        "code": "ru",
        "name": "Russian",
        "nativeName": "Русский"
    }
]
```

Any new language can be created using `/languages` resource

```js
const newLanguage = {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe'
};

agent
    .post('http://localhost:9005/api/v1.0/languages')
    .send(newLanguage)
    .then(res => {
        console.log(res.status);  // 201
        console.log(res.body);    // code of the new language
    });
```

Languages API does not check validity of the two digit ISO codes.  There letter ISO codes or any other language encoding can be used if necessary.  Codes are used in other resources to identify the language and are the only language resource property that are used elsewhere in this API.

Any existing language detail can be shown individually

```js
agent
    .get('http://localhost:9005/api/v1.0/languages/es')
    .then(res => {
        console.log(res.status); // 200
        console.log(res.body);  // definition of spanish
    });
```

Server responds with language details in the body

```js
{
    "code": "es",
    "name": "Spanish",
    "nativeName": "Español"
}
```

Existing languages, including the preloaded ones, can the updated

```js
const languageUpdate = {
    name: 'Castilian Spanish',
    nativeName: 'Castillan'
};

agent
    .patch('http://localhost:9005/api/v1.0/languages/es')
    .send(languageUpdate)
    .then(res => {
        console.log(res.status);  // 204
    });
```

Language code updates are not allowed.  To use a new code for an existing language, the existing language resource has to deleted and recreated with the new code. Deleting a language is possible using `/languages/{code}` resource

```js
agent
    .delete('http://localhost:9005/api/v1.0/languages/fr')
    .then(res => {
        console.log(res.status);  // 204
    });
```

Deleting language resources are only allowed if no other active resource exists in or refer to that language. All changes can be verified listing the languages using `/languages` resource

```js
[
    {
        "code": "en",
        "name": "English",
        "nativeName": "English"
    },
    {
        "code": "es",
        "name": "Castilian Spanish",
        "nativeName": "Castillan"
    },
    {
        "code": "jp",
        "name": "Japanese",
        "nativeName": "日本語"
    },
    {
        "code": "ru",
        "name": "Russian",
        "nativeName": "Русский"
    },
    {
        "code": "tr",
        "name": "Turkish",
        "nativeName": "Türkçe"
    }
]
```

##### Translations

Every resource field in this API that is designed to be user facing (shown to user in a user interface) can be translated into any language that is defined as a language resource. Such fields are referred as `text` fields.

Translations are available to any [GET] request by specifying the language as an url query parameter. If a language is specified as a query parameter but the translation does not exist, server always responds with the English version instead.

English versions of text fields can be updated using the same resources that translates and is specified below; `en` specified as language code for this case.

###### Questions

All question text fields are translated by `/questions/text/{language}` resource

```js
const choicesQxTurkish = {
    'id': 4,
    'text': 'Hangi eksersizleri yapıyorsunuz?',
    'choices': [
        {
            'id': 5,
            'text': 'Yürüyüş'
        },
        {
            'id': 6,
            'text': 'Yavaş Koşu'
        },
        {
            'id': 7,
            'text': 'Koşu'
        },
        {
            'id': 8,
            'text': 'Lütfen başka bir eksersiz belirtiniz.'
        }
    ]
};

agent
    .patch('http://localhost:9005/api/v1.0/questions/text/tr')
    .send(choicesQxTurkish)
    .then(res => {
        console.log(res.status);  // 204
    });
```

Translations are available to any [GET] method that responds with any one of questions text fields by specifying language url query parameter. As an example for `/questions` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/questions/4')
    .query({language: 'tr'})
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // Turkish version of the questions
    });
```

server responds with the Turkish translation in the body

```js
{
    "id": 4,
    "type": "choices",
    "text": "Hangi eksersizleri yapıyorsunuz?"
    ],
    "choices": [
        {
            "id": 5,
            "text": "Yürüyüş",
            "type": "bool"
        },
        {
            "id": 6,
            "text": "Yavaş Koşu",
            "type": "bool"
        },
        {
            "id": 7,
            "text": "Koşu",
            "type": "bool"
        },
        {
            "id": 8,
            "text": "Lütfen başka bir eksersiz belirtiniz.",
            "type": "text"
        }
    ]
}
```

###### Surveys

Survey text fields that do not belong to its questions are translated by `/surveys/text/{language} resource

```js
const surveyTurkish = {
    id: 1,
    name: 'Örnek',
    sections: [{
        id: 1,
        name: 'Kişisel Bilgiler'
    }, {
        id: 2,
        name: 'Sağlık'
    }]
};

agent
    .patch('http://localhost:9005/api/v1.0/surveys/text/tr')
    .send(surveyTurkish)
    .then(res => {
        console.log(res.status);  // 204
    });
```

Currently questions cannot be translated using `/surveys/text/{language}` resource and `/questions/text/{language}` has to be used.  Translations are available to any [GET] method that responds with any one of surveys text fields by specifying language url query parameter. As an example for `/surveys` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/surveys/1')
    .query({language: 'tr'})
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // Turkish version of the survey
    });
```

responds with the Turkish translation in the body

```js
{
    "id": 1,
    meta: {
        displayAsWizard: true,
        saveProgress: false
    },
    "name": "Örnek",
    "questions": [
        {
            "id": 1,
            "type": "text",
            "text": "Please describe reason for your enrollment?",
            "required": false
        },
        {
            "id": 2,
            "type": "bool",
            "text": "Do you own a pet?",
            "required": true
        },
        {
            "id": 5,
            "type": "choice",
            "text": "What is your hair color?",
            "choices": [
                {
                    "id": 9,
                    "text": "Black"
                },
                {
                    "id": 10,
                    "text": "Brown"
                },
                {
                    "id": 11,
                    "text": "Blonde"
                },
                {
                    "id": 12,
                    "text": "Other"
                }
            ],
            "required": true
        },
        {
            "id": 4,
            "type": "choices",
            "text": "Hangi eksersizleri yapıyorsunuz?",
            "choices": [
                {
                    "id": 5,
                    "type": "bool",
                    "text": "Yürüyüş"
                },
                {
                    "id": 6,
                    "type": "bool",
                    "text": "Yavaş Koşu"
                },
                {
                    "id": 7,
                    "type": "bool",
                    "text": "Koşu"
                },
                {
                    "id": 8,
                    "type": "text",
                    "text": "Lütfen başka bir eksersiz belirtiniz."
                }
            ],
            "required": false
        }
    ]
}
```

Note that all questions that are not yet translated is shown in English.

###### Consent Types

The `title` field of consent type is translated by `/consent-types/text/{language}` resource

```js
const consentTypeConsentTurkish = {
    id: 2,
    title: 'İzin Metni'
};

agent
    .patch('http://localhost:9005/api/v1.0/consent-types/text/tr')
    .send(consentTypeConsentTurkish)
    .then(res => {
        console.log(res.status);  // 204
    });
```

Translations are available to any [GET] request that responds with the `title` field. As an example for `/consent-type` resource

```js
agent
    .get(`http://localhost:9005/api/v1.0/consent-types/2`)
    .query({ language: 'tr' })
    .then(res => {
        console.log(res.status); // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // Turkish version of the consent type
    });
```

Server responds with the Turkish translation in the body

```js
{
    "id": 2,
    "name": "consent",
    "type": "single",
    "title": "İzin Metni"
}
```

###### Consent Documents

Consent document text fields are translated by `/consent-documents/text/{language} resource

```js
const consentDocTurkish = {
    id: 3,
    content: 'Bu güncelleştirilmiş bir izin metnidir.',
    updateComment: 'Güncelleştirilmiş ibaresi eklendi'
};

agent
    .patch('http://localhost:9005/api/v1.0/consent-documents/text/tr')
    .send(consentDocTurkish)
    .then(res => {
        console.log(res.status);  // 204
    });
```
Translations are available to any [GET] request that responds with one of consent document text fields by specifying language as url query parameter. As an example for `/consent-documents/{id}` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/consent-documents/3')
    .query({language: 'tr'})
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // Turkish version of the consent document
    });
```

server responds with the Turkish translation in the body

```js
{
    "id": 3,
    "typeId": 2,
    "content": "Bu güncelleştirilmiş bir izin metnidir.",
    "updateComment": "Güncelleştirilmiş ibaresi eklendi"
}
```
###### Smtp

Reset password email contents and subject is translated using `smtp/text/{code}` resource

```js
const emailContentTurkish = {
    subject: 'Kayıtlama Yönetimi',
    content: 'Buna tıklayınız: ${link}'
};

agent
    .patch('http://localhost:9005/api/v1.0/smtp/text/tr')
    .send(emailContentTurkish)
    .then(res => {
        console.log(res.status);  // 204
    });
```

When reset token generation is requested by the client, the language of the email content and subject can also be specified

```js
agent
    .post('http://localhost:9005/api/v1.0/reset-tokens')
    .send({ email: 'test2@example2.com', language: 'tr' })
    .then(res => {
        console.log(res.status);  // 204
    });
```

##### Language Specification
<a name="language_spec"/>

This API keeps track of the language the Consent Documents and Questions are in when participants signs the documents or answer questions.  In all cases language has to be specified as a query parameter (Ex: `{ language: 'tr' } and this is client's responsibility.  This applies to the following resources

- `/profiles` [POST] and [PATCH]
- `/answers` [POST]
- `/consent-signatures` [POST]


### Consents
<a name="sage"/>

This API allows grouping of multiple Consent Documents.  This overall collection, which is simply referred as Consent hereafter, is mainly designed to support [Sage](http://sagebase.org/platforms/governance/participant-centered-consent-toolkit/).

Consents are created by specifying Consent Types they are composed of using `/consents` resource

```js
const consent = {
    name: 'primary-consent',
    sections: [1, 2]
};

agent
    .post('http://localhost:9005/api/v1.0/consents')
    .send(consent)
    .then(res => {
        console.log(res.status);  // 201
        console.log(res.body.id); // id of the new consent
    });
```

Consent `name` property is not designed to be user facing and identify the consent in the API request.

A list of all consents is available using `/consents` resource

```js
agent
    .get('http://localhost:9005/api/v1.0/consents')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // list of consents
    });
```

Server responds with the list of consents in the body

```js
[
    {
        "id": 1,
        "name": "primary-consent",
        "sections": [
            1,
            2
        ]
    }
]
```

Consents can be shown using resource `/consents/{id}`

```js
agent
    .get('http://localhost:9005/api/v1.0/consents/1')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // consent details
    });
```

Server responds with the details of the Consent in the body

```js
{
    "id": 1,
    "name": "primary-consent",
    "sections": [
        1,
        2
    ]
}
```

Consent can also be shown using resource `/consents/name/{name}`

```js
agent
    .get('http://localhost:9005/api/v1.0/consents/name/primary-consent')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // consent details
    });
```

Server responds with the same details as `/consents/{id}`.

Actual content of the documents in Consent is available unauthorized using `/consents/{id}/documents` resource

```
agent
    .get('http://localhost:9005/api/v1.0/consents/1/documents')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // consent with documents
    });
```

Server responds with the Consent and details of its documents in the body.

```js
{
    "id": 1,
    "name": "primary-consent",
    "sections": [
        {
            "id": 1,
            "content": "This is a terms of use document.",
            "updateComment": null,
            "name": "terms-of-use",
            "type": "single",
            "title": "Terms of Use"
        },
        {
            "id": 3,
            "content": "This is an updated Consent Form.",
            "updateComment": "Updated notice added",
            "name": "consent",
            "type": "single",
            "title": "Consent Form"
        }
    ]
}
```

Same response is also available using the name of the consent and resource `/consents/name/{name}/documents`

```
agent
    .get('http://localhost:9005/api/v1.0/consents/name/primary-consent/documents')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // consent with documents
    });
```

Resource `/consents/{id}/documents` only provide document content.  It is available unauthorized since certain use cases may require documents before a user is authenticated or registered.  Authorized users can use resource `/consents/{id}/user-documents` to show both the consent document content and signature status

```js
agent
    .get('http://localhost:9005/api/v1.0/consents/1/user-documents')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // full consent details with signature information
    });
```

```js
{
    "id": 1,
    "name": "primary-consent",
    "sections": [
        {
            "id": 1,
            "content": "This is a terms of use document.",
            "updateComment": null,
            "name": "terms-of-use",
            "type": "single",
            "title": "Terms of Use",
            "signature": true,
            "language": "en"
        },
        {
            "id": 3,
            "content": "This is an updated Consent Form.",
            "updateComment": "Updated notice added",
            "name": "consent",
            "type": "single",
            "title": "Consent Form",
            "signature": false
        }
    ]
}
```

Same response is available using the name of the consent and resource `/consents/name/{name}/user-documents`

```js
agent
    .get('http://localhost:9005/api/v1.0/consents/name/primary-consent/user-documents')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // full consent details with signature information
    });
```

Updating Consent Document remains the same even when the document is a section of Consent

```js
const consentDocUpdate = {
    typeId: 1,
    content: 'This is an updated Terms of Use.',
    updateComment: 'Updated TOU notice added'
};

agent
    .post('http://localhost:9005/api/v1.0/consent-documents')
    .send(consentDocUpdate)
    .then(res => {
        console.log(res.status);  // 201
        console.log(res.body.id); // id of the updated consent document
    });
```

Resource `/consents/{id}/user-documents` or `/consents/name/{name}/user-documents` can be used to show the updated

```js
agent
    .get('http://localhost:9005/api/v1.0/consents/name/primary-consent/user-documents')
    .then(res => {
        console.log(res.status);  // 200
        console.log(JSON.stringify(res.body, undefined, 4)); // full consent details with signature information
    });
```

Server responds with the updated content and signature information

```js
{
    "id": 1,
    "name": "primary-consent",
    "sections": [
        {
            "id": 4,
            "content": "This is an updated Terms of Use.",
            "updateComment": "Updated TOU notice added",
            "name": "terms-of-use",
            "type": "single",
            "title": "Terms of Use",
            "signature": false
        },
        {
            "id": 3,
            "content": "This is an updated Consent Form.",
            "updateComment": "Updated notice added",
            "name": "consent",
            "type": "single",
            "title": "Consent Form",
            "signature": false
        }
    ]
}
```

Since Consent sections are expected to be signed at the same time, an additional resource `/consent-signatures/bulk` is provided

```js
agent
    .post('http://localhost:9005/api/v1.0/consent-signatures/bulk')
    .send({ consentDocumentIds: [3, 4] })
    .then(res => {
        console.log(res.status);  // 201
    });
```

Changes in signature status can be shown again by using resource `/consents/{id}/user-documents` or `/consents/name/{name}/user-documents`

```js
{
    "id": 1,
    "name": "primary-consent",
    "sections": [
        {
            "id": 4,
            "content": "This is an updated Terms of Use.",
            "updateComment": "Updated TOU notice added",
            "name": "terms-of-use",
            "type": "single",
            "title": "Terms of Use",
            "signature": true,
            "language": "en"
        },
        {
            "id": 3,
            "content": "This is an updated Consent Form.",
            "updateComment": "Updated notice added",
            "name": "consent",
            "type": "single",
            "title": "Consent Form",
            "signature": true,
            "language": "en"
        }
    ]
}
```
