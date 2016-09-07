'use strict';

const models = require('../../models');

const Survey = models.Survey;
const Answer = models.Answer;

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
    Survey.createSurvey(survey).then(function (id) {
        res.status(201).json({
            id
        });
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
