'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.listSurveyConsentDocuments = function listSurveyConsentDocuments(req, res) {
    const params = {
        userId: req.user.id,
        surveyId: _.get(req, 'swagger.params.survey-id.value'),
        action: _.get(req, 'swagger.params.action.value'),
    };
    const options = {
        language: _.get(req, 'swagger.params.language.value'),
        detail: _.get(req, 'swagger.params.detail.value'),
    };
    req.models.surveyConsentDocument.listSurveyConsentDocuments(params, options)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
