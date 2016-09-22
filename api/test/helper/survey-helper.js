'use strict';

const _ = require('lodash');

const qxHelper = require('./question-helper');

exports.buildServerSurveyFromClientSurvey = function (clientSurvey, serverSurvey) {
    const ids = _.map(serverSurvey.questions, 'id');
    return qxHelper.buildServerQuestions(clientSurvey.questions, ids).then(function (expectedQuestions) {
        const result = {
            id: serverSurvey.id,
            name: clientSurvey.name,
            questions: expectedQuestions
        };
        return result;
    });
};

exports.formAnswersToPost = function (survey, answersSpec) {
    const questions = survey.questions;
    const result = answersSpec.reduce(function (r, spec, index) {
        if (spec !== null) {
            const entry = {
                questionId: questions[index].id,
                answer: {}
            };
            if (spec.choices) {
                entry.answer.choices = spec.choices.map(function (cindex) {
                    return questions[index].choices[cindex].id;
                });
            }
            if (spec.hasOwnProperty('choice')) {
                entry.answer.choice = questions[index].choices[spec.choice].id;
            }
            if (spec.hasOwnProperty('textValue')) {
                entry.answer.textValue = spec.textValue;
            }
            if (spec.hasOwnProperty('boolValue')) {
                entry.answer.boolValue = spec.boolValue;
            }
            r.push(entry);
        }
        return r;
    }, []);
    return result;
};

exports.formAnsweredSurvey = function (survey, answers) {
    const result = _.cloneDeep(survey);
    result.questions.forEach(function (question, index) {
        question.answer = answers[index].answer;
    });
    return result;
};
