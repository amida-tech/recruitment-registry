'use strict';

const _ = require('lodash');

const qxHelper = require('./question-helper');

exports.buildServerSurvey = function (clientSurvey, serverSurvey) {
    const ids = _.map(serverSurvey.questions, 'id');
    return qxHelper.buildServerQuestions(clientSurvey.questions, ids).then(function (expectedQuestions) {
        const result = {
            id: serverSurvey.id,
            name: clientSurvey.name,
            released: clientSurvey.released,
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
                    const { id } = questions[index].choices[cindex.index];
                    const result = { id };
                    if (cindex.textValue) {
                        result.textValue = cindex.textValue;
                    } else {
                        result.boolValue = true;
                    }
                    return result;
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
