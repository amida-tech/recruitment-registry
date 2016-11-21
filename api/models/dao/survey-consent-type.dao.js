'use strict';

const _ = require('lodash');

const db = require('../db');

const SurveyConsentType = db.SurveyConsentType;

module.exports = class SurveyConsentTypeDAO {
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
                    const options = { typeIds };
                    if (tx) {
                        options.transaction = tx;
                    }
                    return this.userConsentDocument.listUserConsentDocuments(userId, options);
                }
            });
    }
};
