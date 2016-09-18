'use strict';

const _ = require('lodash');

const models = require('../models');

const Answer = models.Answer;

exports.createAnswers = function (req, res) {
    var userId = req.user.id;
    var answers = req.body;
    answers.userId = userId;
    Answer.createAnswers(answers).then(function () {
        res.status(201).json({});
    }).catch(function (err) {
        res.status(422).send(err);
    });
};
