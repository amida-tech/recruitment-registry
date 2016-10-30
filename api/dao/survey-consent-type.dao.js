'use strict';

const _ = require('lodash');

const db = require('../models/db');

const SurveyConsentType = db.SurveyConsentType;

module.exports = class {
	constructor(dependencies) {
        Object.assign(this, dependencies);
	}

    createSurveyConsentType({ surveyId, consentTypeId, action }) {
        return SurveyConsentType.create({ surveyId, consentTypeId, action })
            .then(({ id }) => ({ id }));
    }

    deleteSurveyConsentType(id) {
        return SurveyConsentType.destroy({ where: { id } });
    }

    listSurveyConsentTypes({ userId, surveyId, action }, tx) {
        const query = {
            where: { surveyId, action },
            raw: true,
            attributes: ['consentTypeId']
        };
        if (tx) {
            query.transaction = tx;
        }
        return SurveyConsentType.findAll(query)
            .then(result => _.map(result, 'consentTypeId'))
            .then(typeIds => {
                if (typeIds.length) {
                    const options = { typeIds, transaction: tx };
                    return this.user.listConsentDocuments(userId, options);
                }
            });
    }
};
