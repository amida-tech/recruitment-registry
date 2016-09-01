'use strict';

const db = require('../../db');

const Survey = db.Survey;
const Answer = db.Answer;

exports.getEmptySurvey = function (req, res) {
    var name = req.params.name;
    Survey.getSurveyByName(name).then(function (survey) {
        res.status(200).json(survey);
    }).catch(function (err) {
        res.status(401).send(err);
    });
};

exports.createSurvey = function (req, res) {
    const survey = req.body;
    Survey.post(survey).then(function (id) {
        res.status(201).json({
            id
        });
    }).catch(function (err) {
        res.status(401).send(err);
    });
};

exports.answerSurvey = function (req, res) {
    var answers = req.body;
    answers.userId = req.user.id;
    Answer.post(answers).then(function () {
        res.status(201).end();
    }).catch(function (err) {
        res.status(401).send(err);
    });
};

exports.getSurveyByName = function (req, res) {
    const name = req.params.name;
    const userId = req.user.id;
    Survey.getAnsweredSurveyByName(userId, name).then(function (survey) {
        res.status(200).json(survey);
    }).catch(function (err) {
        res.status(401).send(err);
    });
};
