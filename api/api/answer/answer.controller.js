'use strict';

const models = require('../../models');

const Answer = models.Answer;

exports.createAnswers = function (req, res) {
    var answers = req.body;
    answers.userId = req.user.id;
    Answer.createAnswers(answers).then(function () {
        res.status(201).end();
    }).catch(function (err) {
        res.status(401).send(err);
    });
};
