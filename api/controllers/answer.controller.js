'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const Answer = models.Answer;

exports.createAnswers = function (req, res) {
    const answers = req.body;
    answers.userId = req.user.id;
    Answer.updateAnswers(answers)
        .then(() => res.status(201).json({}))
        .catch(shared.handleError(res));
};

exports.getAnswers = function (req, res) {
    const surveyId = _.get(req, 'swagger.params.surveyId.value');
    const userId = req.user.id;
    Answer.getAnswers({ userId, surveyId })
        .then(answers => res.status(200).json(answers))
        .catch(shared.handleError(res));
};
