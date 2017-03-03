'use strict';

const _ = require('lodash');

const models = require('../models');
const shared = require('./shared.js');

const surveyConsentDocument = models.surveyConsentDocument;

exports.listSurveyConsentDocuments = function (req, res) {
    const userId = req.user.id;
    const surveyId = _.get(req, 'swagger.params.survey-id.value');
    const action = _.get(req, 'swagger.params.action.value');
    //const language = _.get(req, 'swagger.params.language.value');
    //const options = { language };
    surveyConsentDocument.listSurveyConsentDocuments({ userId, surveyId, action })
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
