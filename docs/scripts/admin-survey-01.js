'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const textQxId = locals.textQxId;
    const boolQxId = locals.boolQxId;
    const choiceQxId = locals.choiceQxId;
    const choicesQxId = locals.choicesQxId;

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
                { text: 'Tennis' },
            ],
        }, {
            text: 'What is your hair color?',
            required: true,
            type: 'choice',
            choices: [
                { text: 'Black' },
                { text: 'Brown' },
                { text: 'Blonde' },
                { text: 'Other' },
            ],
        }, {
            text: 'Where were you born?',
            required: true,
            type: 'text',
        }, {
            text: 'Are you injured?',
            required: false,
            type: 'bool',
        }],
    };

    survey = {
        name: 'Example',
        questions: [{
            required: false,
            id: textQxId,
        }, {
            required: true,
            id: boolQxId,
        }, {
            required: true,
            id: choiceQxId,
        }, {
            required: false,
            id: choicesQxId,
        }],
    };

    survey = {
        name: 'Example',
        questions: [{
            required: false,
            id: textQxId,
        }, {
            required: true,
            id: boolQxId,
        }, {
            text: 'What is your hair color?',
            required: true,
            type: 'choice',
            choices: [
                { text: 'Black' },
                { text: 'Brown' },
                { text: 'Blonde' },
                { text: 'Other' },
            ],
        }, {
            required: false,
            id: choicesQxId,
        }],
    };

    survey = {
        name: 'Example',
        questions: [{
            required: false,
            id: textQxId,
        }, {
            required: true,
            id: boolQxId,
        }, {
            text: 'What is your hair color?',
            required: true,
            type: 'choice',
            choices: [
                { text: 'Black' },
                { text: 'Brown' },
                { text: 'Blonde' },
                { text: 'Other' },
            ],
        }, {
            required: false,
            id: choicesQxId,
        }],
    };

    survey = {
        name: 'Example',
        meta: {
            displayAsWizard: true,
            saveProgress: false,
        },
        questions: [{
            required: false,
            id: textQxId,
        }, {
            required: true,
            id: boolQxId,
        }, {
            text: 'What is your hair color?',
            required: true,
            type: 'choice',
            choices: [
                { text: 'Black' },
                { text: 'Brown' },
                { text: 'Blonde' },
                { text: 'Other' },
            ],
        }, {
            required: false,
            id: choicesQxId,
        }],
    };

    return locals.agent
        .post('http://localhost:9005/api/v1.0/surveys')
        .send(survey)
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the new survey
            locals.surveyId = res.body.id;
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
