/* global describe,before,after,beforeEach,afterEach,it,xit*/
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
    var result = answersSpec.reduce(function (r, spec, index) {
        if (spec !== null) {
            var entry = {
                questionId: questions[index].id
            };
            if (spec.isChoice) {
                let answer = spec.answer;
                if (Array.isArray(answer)) {
                    entry.answer = answer.map(function (cindex) {
                        return questions[index].choices[cindex].id;
                    });
                } else {
                    entry.answer = questions[index].choices[spec.answer].id;
                }
            } else {
                entry.answer = spec.answer;
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
