'use strict';

const models = require('../models');
const shared = require('./shared.js');

const Answer = models.Answer;

exports.createAnswers = function (req, res) {
    const answers = req.body;
    answers.userId = req.user.id;
    Answer.createAnswers(answers)
        .then(() => res.status(201).json({}))
        .catch(shared.handleError(res));
};
