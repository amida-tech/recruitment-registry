'use strict';

const _ = require('lodash');

const helper = require('../helpers');

exports.buildServerSurveyFromClientSurvey = function (clientSurvey, serverSurvey) {
    const ids = _.map(serverSurvey.questions, 'id');
    return helper.buildServerQuestions(clientSurvey.questions, ids).then(function (expectedQuestions) {
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
            } else if (spec.hasOwnProperty('choice')) {
                entry.answer.choice = questions[index].choices[spec.choice].id;
            } else if (spec.hasOwnProperty('textValue')) {
                entry.answer.textValue = spec.textValue;
            } else if (spec.hasOwnProperty('boolValue')) {
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
