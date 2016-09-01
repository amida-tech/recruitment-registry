'use strict';

const db = require('../../db');

const Survey = db.Survey;

exports.getEmptySurvey = function (req, res) {
    var name = req.params.name;
    Survey.getSurveyByName(name).then(function (survey) {
        survey.name = survey.name;
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
