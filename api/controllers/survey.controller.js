'use strict';

const _ = require('lodash');

const models = require('../models');

const Survey = models.Survey;

exports.getEmptySurvey = function (req, res) {
    const name = _.get(req, 'swagger.params.name.value');
    Survey.getSurveyByName(name).then(function (survey) {
        res.status(200).json(survey);
    }).catch(function (err) {
        res.status(500).send(err);
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
    const userId = req.user.id;
    const name = _.get(req, 'swagger.params.name.value');
    Survey.getAnsweredSurveyByName(userId, name).then(function (survey) {
        res.status(200).json(survey);
    }).catch(function (err) {
        res.status(401).send(err);
    });
};
