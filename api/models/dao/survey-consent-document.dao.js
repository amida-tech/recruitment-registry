'use strict';

const _ = require('lodash');

const db = require('../db');

const SurveyConsent = db.SurveyConsent;

module.exports = class SurveyConsentDocumentDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    listSurveyConsentDocuments({ userId, surveyId, action }, tx) {
        const query = {
            where: { surveyId, action },
            raw: true,
            attributes: ['consentId', 'consentTypeId']
        };
        if (tx) {
            query.transaction = tx;
        }
        return SurveyConsent.findAll(query)
            .then(surveyConsents => this.surveyConsent.updateConsentsInSurveyConsents(surveyConsents))
            .then(surveyConsents => {
                if (surveyConsents.length < 1) {
                    return surveyConsents;
                }
                const typeIds = _.map(surveyConsents, 'consentTypeId');
                const options = { typeIds, keepTypeId: true };
                if (tx) {
                    options.transaction = tx;
                }
                return this.userConsentDocument.listUserConsentDocuments(userId, options)
                    .then(docs => {
                        const typeIdMap = _.keyBy(surveyConsents, 'consentTypeId');
                        docs.forEach(doc => {
                            const surveyConsent = typeIdMap[doc.typeId];
                            if (surveyConsent.consentId) {
                                doc.consentId = surveyConsent.consentId;
                                doc.consentName = surveyConsent.consentName;
                            }
                            delete doc.typeId;
                        });
                        return docs;
                    });
            });
    }
};
