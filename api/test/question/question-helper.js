'use strict';

const _ = require('lodash');

const helper = require('../helpers');

exports.prepareServerQuestion = function (question) {
    delete question.id;
    const choices = question.choices;
    if (choices && choices.length) {
        question.choices = _.map(choices, 'text');
    }
    return question;
};

exports.prepareClientQuestions = function (questions, ids, indices) {
    const testIds = _.pullAt(ids.slice(), indices);
    const samples = _.pullAt(questions.slice(), indices);
    return helper.buildServerQuestions(samples, testIds);
};
