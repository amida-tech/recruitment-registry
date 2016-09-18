'use strict';

const models = require('../models');

const Answer = models.Answer;

exports.createAnswers = function (req, res) {
    const userId = req.user.id;
    const answers = req.body;
    answers.userId = userId;
    Answer.createAnswers(answers).then(function () {
        res.status(201).json({});
    }).catch(function (err) {
        res.status(422).send(err);
    });
};
