'use strict';

const db = require('../db');

const SurveyConsent = db.SurveyConsent;

module.exports = class SurveyConsentDAO {
    constructor() {}

    createSurveyConsent({ surveyId, consentTypeId, action }) {
        return SurveyConsent.create({ surveyId, consentTypeId, action })
            .then(({ id }) => ({ id }));
    }

    deleteSurveyConsent(id) {
        return SurveyConsent.destroy({ where: { id } });
    }
};
